const assert=require('node:assert/strict');
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
async function main(){
 const orders=await p.purchaseOrder.findMany({where:{orderReference:{startsWith:'DEMO-YEAR-'}},include:{items:true,paymentLinks:{include:{offlinePayment:true}},_count:{select:{vouchers:true}}}});
 assert(orders.length>=730,'Expected a year of daily orders for both demo accounts');
 const dates=new Set(orders.map(o=>o.orderReference.slice(-10)));
 assert(dates.size>=365,'Missing daily history');
 for(const order of orders){
  const total=order.items.reduce((s,i)=>s+Number(i.lineTotal),0);
  assert(Math.abs(total-Number(order.subtotal))<0.01,`Subtotal ${order.orderReference}`);
  assert(Math.abs(Number(order.totalPayable)-(total-Number(order.discountTotal)))<0.01,'Payable mismatch');
  for(const link of order.paymentLinks) assert.equal(Number(link.offlinePayment.amount),Number(order.totalPayable));
  if(order.status==='ORDER_CONFIRMED')assert.equal(order._count.vouchers,order.items.reduce((s,i)=>s+i.quantity,0),'Voucher count mismatch');
 }
 const invalid=await p.$queryRaw`SELECT count(*)::int AS count FROM "Voucher" WHERE "serialNo" LIKE 'DEMO-YEAR-%' AND ("expiryDate" < "effectiveDate" OR "redeemedAt" < "effectiveDate" OR "redeemedAt" > NOW())`;
 assert.equal(invalid[0].count,0,'Invalid voucher chronology');
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kuala_Lumpur'});
 assert(dates.has(today),'Today missing');
 console.log(JSON.stringify({verified:true,days:dates.size,orders:orders.length,today,vouchers:orders.reduce((s,o)=>s+o._count.vouchers,0)},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>p.$disconnect());
