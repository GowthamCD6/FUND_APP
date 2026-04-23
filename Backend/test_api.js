const c=require('./src/controllers/user/portfolioController'); c.getGroupMonthlyInfo({user:{userId:2}, params:{groupId:'GRP-1'}}, {status:()=>({json:console.log})}).then(()=>process.exit(0))
