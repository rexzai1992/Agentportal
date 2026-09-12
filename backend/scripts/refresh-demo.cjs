// Daily, additive fixtures for the isolated demo database. Never resets visitor work.
const { PrismaClient } = require('@prisma/client');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const connection = new URL(process.env.DATABASE_URL);
connection.searchParams.set('connection_limit','1');
const p = new PrismaClient({datasources:{db:{url:connection.toString()}}});
const prefix = 'DEMO-YEAR';
const day = 86400000;
const money = n => Math.round(n * 100) / 100;
async function main() {
  if (process.env.APP_URL !== 'https://ota-test.13-140-148-77.sslip.io') throw Error('This fixture is restricted to the OTA test deployment');
  if (process.env.APP_MODE !== 'demo' || process.env.DEMO_DATABASE_NAME !== new URL(process.env.DATABASE_URL).pathname.slice(1)) throw Error('Explicit demo database acknowledgement required');
  const today = new Date(new Date().toLocaleDateString('en-CA', {timeZone:'Asia/Kuala_Lumpur'})+'T00:00:00+08:00');
  const lock = await p.$queryRaw`SELECT pg_try_advisory_lock(80940909) AS locked`;
  if (!lock[0].locked) return;
  const users = await p.user.findMany();
  const admin = users.find(u => u.role === 'ADMIN');
  const finance = users.find(u => u.role === 'FINANCE');
  const staff = users.find(u => u.role === 'STAFF');
  if (!admin || !finance || !staff) throw Error('Base demo users missing');
  const group = await p.paymentGroup.findFirst({where:{active:true}});
  const type = await p.paymentType.findFirst({where:{active:true}});
  const states = ['PENDING_PAYMENT','PENDING_APPROVAL','PENDING_APPROVAL','ORDER_CONFIRMED','ORDER_CONFIRMED','ORDER_CONFIRMED','REVISION','REJECTED'];
  const root = process.env.UPLOAD_DIR;
  if (!root || !path.isAbsolute(root)) throw Error('Absolute UPLOAD_DIR required');
  await fs.mkdir(root,{recursive:true});
  let added=0;
  for (const code of ['A20260001','P20260001']) {
    const user = users.find(u => u.username === code);
    if (!user?.agentId) throw Error('Demo account missing: '+code);
    await p.agent.update({where:{id:user.agentId},data:{accountExpiry:new Date(today.getTime()+365*day),kplExpiryDate:new Date(today.getTime()+365*day)}});
    const assignment = await p.schemeAssignment.findFirst({where:{agentId:user.agentId},include:{scheme:{include:{revisions:{where:{status:'ACTIVE',effectiveDate:{lte:new Date()}},orderBy:{revisionNumber:'desc'},take:1,include:{products:true}}}}}});
    const revision = assignment?.scheme.revisions[0];
    if (!revision?.products.length) throw Error('Active scheme missing for '+code);
    await p.schemeRevision.update({where:{id:revision.id},data:{effectiveDate:new Date(today.getTime()-366*day)}});
    for (let offset=364;offset>=0;offset--) {
      const date = new Date(today.getTime()-offset*day);
      const stamp = new Date(date.getTime()+8*3600000).toISOString().slice(0,10);
      const i = Math.floor(date.getTime()/day)%states.length;
      const ref = `${prefix}-${code[0]}-${stamp}`;
      if (await p.purchaseOrder.findUnique({where:{orderReference:ref}})) continue;
      const createdAt = date;
      const status=offset>7 ? (i===7?'REJECTED':'ORDER_CONFIRMED') : states[i];
      const items=revision.products.slice(0,2).map(sp=>{
        const quantity=Math.min(sp.maxQty??100,Math.max(sp.minQty,20+i*3+(date.getUTCMonth()%3)*5));
        return {ticketTypeId:sp.ticketTypeId,schemeProductId:sp.id,quantity,unitPrice:Number(sp.price),lineTotal:money(quantity*Number(sp.price))};
      });
      const subtotal=money(items.reduce((s,x)=>s+x.lineTotal,0));
      const incentiveTotal=money(items.reduce((s,x,j)=>s+x.lineTotal*Number(revision.products[j].incentiveRate??0)/100,0));
      const discountTotal=money(items.reduce((s,x,j)=>s+x.lineTotal*Number(revision.products[j].discountRate??0)/100,0));
      const totalPayable=money(subtotal-discountTotal);
      let slip;
      if (status!=='PENDING_PAYMENT') {
        const name=ref+'-sample-slip.png';
        const svg=`<svg width="1000" height="520"><rect width="100%" height="100%" fill="#f3f6f9"/><g font-family="sans-serif" fill="#152536"><text x="50" y="85" font-size="38">DEMO ONLY - NOT A REAL PAYMENT</text><text x="50" y="165" font-size="26">Sample bank transfer slip</text><text x="50" y="230" font-size="22">Reference: ${ref}</text><text x="50" y="290" font-size="22">Account: ${code}</text><text x="50" y="350" font-size="26">Amount: MYR ${totalPayable.toFixed(2)}</text><text x="50" y="435" font-size="22">For Finance and Admin workflow testing only.</text></g></svg>`;
        const buffer=await sharp(Buffer.from(svg)).png().toBuffer();
        await fs.writeFile(path.join(root,name),buffer);
        slip={fileName:name,storagePath:name,mimeType:'image/png',sizeBytes:buffer.length};
      }
      await p.$transaction(async tx=>{
        const order=await tx.purchaseOrder.create({data:{orderReference:ref,agentId:user.agentId,schemeRevisionId:revision.id,status,subtotal,incentiveTotal,discountTotal,totalPayable,createdByUserId:user.id,createdAt,items:{create:items}}});
        if (slip) {
          const paid = i===2 || ['ORDER_CONFIRMED','REJECTED','REVISION'].includes(status);
          const decided=['ORDER_CONFIRMED','REJECTED','REVISION'].includes(status);
          const remarks=status==='REVISION'?'DEMO: Please upload a clearer sample slip.':status==='REJECTED'?'DEMO: Bank reference does not match.':'DEMO workflow sample';
          const payment=await tx.offlinePayment.create({data:{agentId:user.agentId,paymentGroupId:group?.id,paymentTypeId:type?.id,amount:totalPayable,bankReference:ref,bankName:'DEMO BANK',status,submittedByUserId:user.id,financePaidByUserId:paid?finance.id:null,financePaidAt:paid?new Date(Math.min(Date.now(),createdAt.getTime()+3600000)):null,adminApprovedByUserId:decided?admin.id:null,adminApprovedAt:decided?new Date(Math.min(Date.now(),createdAt.getTime()+7200000)):null,remarks,createdAt,orderLinks:{create:{purchaseOrderId:order.id}},history:{create:[{toStatus:'PENDING_APPROVAL',actorUserId:user.id,remarks:'DEMO: Sample slip submitted',createdAt},...(paid?[{fromStatus:'PENDING_APPROVAL',toStatus:'PENDING_APPROVAL',actorUserId:finance.id,remarks:'DEMO: Marked paid by Finance',createdAt:new Date(Math.min(Date.now(),createdAt.getTime()+3600000))}]:[]),...(decided?[{fromStatus:'PENDING_APPROVAL',toStatus:status,actorUserId:admin.id,remarks,createdAt:new Date(Math.min(Date.now(),createdAt.getTime()+7200000))}]:[])]}}});
          const doc=await tx.document.create({data:{...slip,ownerType:'OFFLINE_PAYMENT',ownerId:payment.id,docType:'PAYMENT_SLIP',uploadedByUserId:user.id,agentId:user.agentId,createdAt}});
          await tx.offlinePayment.update({where:{id:payment.id},data:{slipDocumentId:doc.id}});
        }
        if (status==='ORDER_CONFIRMED') {
          let seq=0;
          for (const item of items) for(let n=0;n<item.quantity;n++) {
            seq++;
            const redeemed=offset>7 ? seq%5!==0 : seq<=2 && i===3;
            const locked=!redeemed && offset<=7 && seq===1 && i===4;
            const expired=!redeemed && offset>90;
            await tx.voucher.create({data:{serialNo:`${ref}-V${String(seq).padStart(3,'0')}`,qrToken:crypto.randomUUID(),source:'PURCHASE',purchaseOrderId:order.id,ticketTypeId:item.ticketTypeId,agentId:user.agentId,effectiveDate:new Date(Math.min(Date.now(),createdAt.getTime()+7200000)),expiryDate:new Date(createdAt.getTime()+90*day),redeemStatus:redeemed?'REDEEMED':locked?'LOCKED':expired?'EXPIRED':'NEW',redeemedAt:redeemed?new Date(Math.min(Date.now(),createdAt.getTime()+3*3600000)):null,redeemedByUserId:redeemed?staff.id:null,entranceGate:redeemed?'Demo Main Gate':null,createdAt, ...(redeemed?{redemptions:{create:{entranceGate:'Demo Main Gate',staffUserId:staff.id,status:'REDEEMED',createdAt:new Date(Math.min(Date.now(),createdAt.getTime()+3*3600000))}}}:{})}});
          }
        }
      },{timeout:30000});
      added++;
    }
  }
  for (let month=0;month<12;month++) {
    const local=new Date(today.getTime()+8*3600000);
    const date=month===0?today:new Date(Date.UTC(local.getUTCFullYear(),local.getUTCMonth()-month,1)-8*3600000);
    const stamp=new Date(date.getTime()+8*3600000).toISOString().slice(0,7);
    for (const [index,status] of ['PENDING','PENDING','REJECTED','REVISION'].entries()) {
      const applicationId=`DEMO-REG-${stamp}-${index}`;
      await p.registration.upsert({where:{applicationId},update:{},create:{applicationId,partyType:index%2?'PARTNER':'AGENT',companyName:`Demo ${['Sunrise','Coral','Horizon','Rainforest'][index]} ${stamp}`,registrationNo:`DEMO-${stamp}-${index}`,email:`sample-${stamp}-${index}@example.invalid`,contactNo:'0000000000',addressLine1:'Demo business address',addressLine2:'Sample district',postcode:'00000',country:'Malaysia',state:'Selangor',status,createdAt:date,termsAcceptedAt:date,remarks:'DEMO ONLY - fictional application',...(status==='PENDING'?{}:{reviewedByUserId:admin.id,reviewedAt:date}),contactPersons:{create:{ownerType:'REGISTRATION',name:'Demo Contact',email:'contact@example.invalid',isPrimary:true}}}});
    }
    const agent=users.find(u=>u.username==='A20260001');
    const renewalId=`demo-renewal-${stamp}`;
    await p.renewalRequest.upsert({where:{id:renewalId},update:{},create:{id:renewalId,agentId:agent.agentId,status:month===0?'PENDING':'APPROVED',kplExpiryDate:new Date(date.getTime()+365*day),createdAt:date,remarks:'DEMO renewal'}});
    const grantId=`demo-grant-${stamp}`;
    if (!await p.complimentaryGrant.findUnique({where:{id:grantId}})) {
      const product=await p.ticketType.findFirst({where:{active:true}});
      await p.complimentaryGrant.create({data:{id:grantId,agentId:agent.agentId,quantity:20,reason:'DEMO monthly familiarisation visit',createdByUserId:admin.id,createdAt:date,vouchers:{create:Array.from({length:20},(_,i)=>({serialNo:`DEMO-COMP-${stamp}-${i}`,qrToken:crypto.randomUUID(),source:'COMPLIMENTARY',ticketTypeId:product.id,agentId:agent.agentId,effectiveDate:date,expiryDate:new Date(date.getTime()+90*day),redeemStatus:date.getTime()+90*day<Date.now()?'EXPIRED':'NEW',createdAt:date}))}}});
    }
  }
  await p.announcement.upsert({where:{id:'demo-current-announcement'},update:{effectiveDate:today,expiryDate:new Date(today.getTime()+2*day)},create:{id:'demo-current-announcement',title:'Demo Mode — explore a year of sample data',body:'Fictional records are added daily. Try purchases, payment approval and voucher redemption. No real payment is required.',displayType:'LOGIN',audience:'BOTH',effectiveDate:today,expiryDate:new Date(today.getTime()+2*day),createdByUserId:admin.id}});
  await p.voucher.updateMany({where:{serialNo:{startsWith:prefix},redeemStatus:{in:['NEW','LOCKED']},expiryDate:{lt:new Date()}},data:{redeemStatus:'EXPIRED'}});
  console.log(JSON.stringify({addedOrders:added,orders:await p.purchaseOrder.count(),payments:await p.offlinePayment.count(),vouchers:await p.voucher.count(),orderStatuses:await p.purchaseOrder.groupBy({by:['status'],_count:true}),voucherStatuses:await p.voucher.groupBy({by:['redeemStatus'],_count:true})},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>p.$disconnect());
