import { adminClient } from "../src/lib/sanity/client.ts";

const officials = [
  { _type: "SAIOfficial", _id: "SAI-1001-AB12", officialId: "SAI-1001-AB12", name: "Ramesh Kumar", city: "Delhi", organization: "SAI Regional Center" },
  { _type: "SAIOfficial", _id: "SAI-1002-CD34", officialId: "SAI-1002-CD34", name: "Priya Singh", city: "Mumbai", organization: "SAI HQ" },
  { _type: "SAIOfficial", _id: "SAI-1003-EF56", officialId: "SAI-1003-EF56", name: "Anita Verma", city: "Bengaluru", organization: "SAI Training Center" },
  { _type: "SAIOfficial", _id: "SAI-1004-GH78", officialId: "SAI-1004-GH78", name: "Suresh Patel", city: "Ahmedabad", organization: "SAI Regional Center" },
  { _type: "SAIOfficial", _id: "SAI-1005-IJ90", officialId: "SAI-1005-IJ90", name: "Meena Gupta", city: "Lucknow", organization: "SAI HQ" },
  { _type: "SAIOfficial", _id: "SAI-1006-KL11", officialId: "SAI-1006-KL11", name: "Arun Sharma", city: "Kolkata", organization: "SAI Training Center" },
  { _type: "SAIOfficial", _id: "SAI-1007-MN22", officialId: "SAI-1007-MN22", name: "Neha Joshi", city: "Jaipur", organization: "SAI Regional Center" },
  { _type: "SAIOfficial", _id: "SAI-1008-OP33", officialId: "SAI-1008-OP33", name: "Vikram Chauhan", city: "Chandigarh", organization: "SAI HQ" },
  { _type: "SAIOfficial", _id: "SAI-1009-QR44", officialId: "SAI-1009-QR44", name: "Sunita Mishra", city: "Patna", organization: "SAI Training Center" },
  { _type: "SAIOfficial", _id: "SAI-1010-ST55", officialId: "SAI-1010-ST55", name: "Rajesh Yadav", city: "Bhopal", organization: "SAI Regional Center" },
  { _type: "SAIOfficial", _id: "SAI-1011-UV66", officialId: "SAI-1011-UV66", name: "Deepa Nair", city: "Thiruvananthapuram", organization: "SAI HQ" },
  { _type: "SAIOfficial", _id: "SAI-1012-WX77", officialId: "SAI-1012-WX77", name: "Manoj Reddy", city: "Hyderabad", organization: "SAI Training Center" },
  { _type: "SAIOfficial", _id: "SAI-1013-YZ88", officialId: "SAI-1013-YZ88", name: "Pooja Bhat", city: "Pune", organization: "SAI Regional Center" },
  { _type: "SAIOfficial", _id: "SAI-1014-AA99", officialId: "SAI-1014-AA99", name: "Amit Desai", city: "Surat", organization: "SAI HQ" },
  { _type: "SAIOfficial", _id: "SAI-1015-BB10", officialId: "SAI-1015-BB10", name: "Kiran Malhotra", city: "Nagpur", organization: "SAI Training Center" },
  { _type: "SAIOfficial", _id: "SAI-1016-CC20", officialId: "SAI-1016-CC20", name: "Seema Khan", city: "Kanpur", organization: "SAI Regional Center" },
  { _type: "SAIOfficial", _id: "SAI-1017-DD30", officialId: "SAI-1017-DD30", name: "Rohit Sinha", city: "Ranchi", organization: "SAI HQ" },
  { _type: "SAIOfficial", _id: "SAI-1018-EE40", officialId: "SAI-1018-EE40", name: "Sneha Das", city: "Guwahati", organization: "SAI Training Center" },
  { _type: "SAIOfficial", _id: "SAI-1019-FF50", officialId: "SAI-1019-FF50", name: "Anil Kapoor", city: "Amritsar", organization: "SAI Regional Center" },
  { _type: "SAIOfficial", _id: "SAI-1020-GG60", officialId: "SAI-1020-GG60", name: "Ritika Jain", city: "Indore", organization: "SAI HQ" },
  { _type: "SAIOfficial", _id: "SAI-1021-HH70", officialId: "SAI-1021-HH70", name: "Kapil Mehra", city: "Noida", organization: "SAI Training Center" },
  { _type: "SAIOfficial", _id: "SAI-1022-II80", officialId: "SAI-1022-II80", name: "Divya Pillai", city: "Kochi", organization: "SAI Regional Center" },
  { _type: "SAIOfficial", _id: "SAI-1023-JJ90", officialId: "SAI-1023-JJ90", name: "Arvind Rao", city: "Mysuru", organization: "SAI HQ" },
  { _type: "SAIOfficial", _id: "SAI-1024-KK01", officialId: "SAI-1024-KK01", name: "Nisha Paul", city: "Shillong", organization: "SAI Training Center" },
  { _type: "SAIOfficial", _id: "SAI-1025-LL02", officialId: "SAI-1025-LL02", name: "Kamal Nath", city: "Raipur", organization: "SAI Regional Center" },
  { _type: "SAIOfficial", _id: "SAI-1026-MM03", officialId: "SAI-1026-MM03", name: "Shalini Roy", city: "Kolkata", organization: "SAI HQ" },
  { _type: "SAIOfficial", _id: "SAI-1027-NN04", officialId: "SAI-1027-NN04", name: "Ajay Thakur", city: "Delhi", organization: "SAI Training Center" },
  { _type: "SAIOfficial", _id: "SAI-1028-OO05", officialId: "SAI-1028-OO05", name: "Geeta Sharma", city: "Mumbai", organization: "SAI Regional Center" },
  { _type: "SAIOfficial", _id: "SAI-1029-PP06", officialId: "SAI-1029-PP06", name: "Harish Chandra", city: "Bengaluru", organization: "SAI HQ" },
  { _type: "SAIOfficial", _id: "SAI-1030-QQ07", officialId: "SAI-1030-QQ07", name: "Rekha Iyer", city: "Chennai", organization: "SAI Training Center" },
];

async function seed() {
  try {
    const res = await Promise.all(officials.map(o => adminClient.createIfNotExists(o)));
   
  } catch (err) {
    console.error("❌ Error seeding officials:", err);
  }
}

seed();
