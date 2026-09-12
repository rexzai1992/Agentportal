// Additive, repeatable fixtures for the isolated VPS demo database. Never resets data.
const { PrismaClient } = require('@prisma/client');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const p = new PrismaClient();
const prefix = 'DEMO-OTA-20260905';
const day = 86400000;
const money = n => Math.round(n * 100) / 100;
async function main() {
  if (process.env.APP_URL !== 'https://ota-test.13-140-148-77.sslip.io') throw Error('This fixture is restricted to the OTA test deployment');
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
    const assignment = await p.schemeAssignment.findFirst({where:{agentId:user.agentId},include:{scheme:{include:{revisions:{where:{status:'ACTIVE',effectiveDate:{lte:new Date()}},orderBy:{revisionNumber:'desc'},take:1,include:{products:true}}}}}});
    const revision = assignment?.scheme.revisions[0];
    if (!revision?.products.length) throw Error('Active scheme missing for '+code);
    for (let i=0;i<states.length;i++) {
      const ref = `${prefix}-${code[0]}-${String(i+1).padStart(2,'0')}`;
      if (await p.purchaseOrder.findUnique({where:{orderReference:ref}})) continue;
      const createdAt = new Date(Date.now()-(states.length-i)*day);
      const status=states[i];
      const items=revision.products.slice(0,2).map(sp=>{
        const quantity=Math.min(sp.maxQty??100,Math.max(sp.minQty,5+i));
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
          const paid = i===2 || status==='ORDER_CONFIRMED';
          const decided=['ORDER_CONFIRMED','REJECTED','REVISION'].includes(status);
          const remarks=status==='REVISION'?'DEMO: Please upload a clearer sample slip.':status==='REJECTED'?'DEMO: Bank reference does not match.':'DEMO workflow sample';
          const payment=await tx.offlinePayment.create({data:{agentId:user.agentId,paymentGroupId:group?.id,paymentTypeId:type?.id,amount:totalPayable,bankReference:ref,bankName:'DEMO BANK',status,submittedByUserId:user.id,financePaidByUserId:paid?finance.id:null,financePaidAt:paid?new Date(createdAt.getTime()+3600000):null,adminApprovedByUserId:decided?admin.id:null,adminApprovedAt:decided?new Date(createdAt.getTime()+7200000):null,remarks,createdAt,orderLinks:{create:{purchaseOrderId:order.id}},history:{create:[{toStatus:'PENDING_APPROVAL',actorUserId:user.id,remarks:'DEMO: Sample slip submitted',createdAt},...(paid?[{fromStatus:'PENDING_APPROVAL',toStatus:'PENDING_APPROVAL',actorUserId:finance.id,remarks:'DEMO: Marked paid by Finance',createdAt:new Date(createdAt.getTime()+3600000)}]:[]),...(decided?[{fromStatus:'PENDING_APPROVAL',toStatus:status,actorUserId:admin.id,remarks,createdAt:new Date(createdAt.getTime()+7200000)}]:[])]}}});
          const doc=await tx.document.create({data:{...slip,ownerType:'OFFLINE_PAYMENT',ownerId:payment.id,docType:'PAYMENT_SLIP',uploadedByUserId:user.id,agentId:user.agentId,createdAt}});
          await tx.offlinePayment.update({where:{id:payment.id},data:{slipDocumentId:doc.id}});
        }
        if (status==='ORDER_CONFIRMED') {
          let seq=0;
          for (const item of items) for(let n=0;n<item.quantity;n++) {
            seq++;
            const redeemed=seq<=2 && i===3;
            const locked=seq===1 && i===4;
            const expired=seq===1 && i===5;
            await tx.voucher.create({data:{serialNo:`${ref}-V${String(seq).padStart(3,'0')}`,qrToken:crypto.randomUUID(),source:'PURCHASE',purchaseOrderId:order.id,ticketTypeId:item.ticketTypeId,agentId:user.agentId,effectiveDate:createdAt,expiryDate:new Date(Date.now()+(expired?-1:365)*day),redeemStatus:redeemed?'REDEEMED':locked?'LOCKED':expired?'EXPIRED':'NEW',redeemedAt:redeemed?new Date(createdAt.getTime()+day):null,redeemedByUserId:redeemed?staff.id:null,entranceGate:redeemed?'Demo Main Gate':null,createdAt, ...(redeemed?{redemptions:{create:{entranceGate:'Demo Main Gate',staffUserId:staff.id,status:'REDEEMED',createdAt:new Date(createdAt.getTime()+day)}}}:{})}});
          }
        }
      },{timeout:30000});
      added++;
    }
  }
  console.log(JSON.stringify({addedOrders:added,orders:await p.purchaseOrder.count(),payments:await p.offlinePayment.count(),vouchers:await p.voucher.count(),orderStatuses:await p.purchaseOrder.groupBy({by:['status'],_count:true}),voucherStatuses:await p.voucher.groupBy({by:['redeemStatus'],_count:true})},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>p.$disconnect());
