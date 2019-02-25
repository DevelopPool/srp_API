
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const team = require('./team');
const util = require('./util');
const user = require('./user');
const announcement = require('./announcement');


const firestore = admin.firestore();
const auth = admin.auth();

exports.register = user.register;
exports.checkLogin = user.checkLogin;
// exports.logout = user.logout;
exports.updateUser = user.updateUser;
exports.getUserDetail = user.getUserDetail;

// exports.addWork = functions.https.onRequest((request, response) => {

// });

// exports.getWork = functions.https.onRequest((request, response) => {

// });

// exports.getAbsentNoteList = functions.https.onRequest((request, response) => {

// });

// exports.askLeave = functions.https.onRequest((request, response) => {
//     let resultObj = {
//         excutionResult: 'fail',
//     };
//     defaultValue = " ";

//     let issuerUID = util.checkEmpty(request.body.issuer) ? request.body.issuer : defaultValue;
//     console.log(issuerUID);
//     let issuerCheck = firestore.collection(util.tables.users.tableName).doc(issuerUID).get().then(doc => {
//         //是否存在
//         if(!doc.exists){
//             return Promise.reject(`${issuerUID} does not exists`)
//         }
//         else{
//             return Promise.resolve(doc);
//         }
//     });
//     let issuerLoginCheck = firestore.collection(util.tables.loginRecord.tableName)
//     .where(util.tables.loginRecord.columns.uid,'==',issuerUID)
//     .orderBy(util.tables.loginRecord.columns.loginTime,'desc')
//     .limit(1).get().then(snapshot=>{
//         if(snapshot.empty){
//             return Promise.reject(`${issuerUID} login check fail`);
//         }
//         else{
//             snapshot.forEach(result=>{
//                 console.log(result);
//             })
//         }
//     });

//     Promise.all([issuerCheck,issuerLoginCheck]).then(values=>{

//     }).then(()=>{
//         console.log(reason);
//         response.json(resultObj);
//     }).catch(reason => {
//         console.log(reason);
//         response.json(resultObj);
//     });


        

// });
// exports.authorizeAbsentNote = functions.https.onRequest((request, response) => {

// });

exports.punch = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };

    let defaultValue = " ";
    let employerUID = util.checkEmpty(request.body.employer) ? request.body.employer : defaultValue;
    let employeeUID = util.checkEmpty(request.body.employee) ? request.body.employee : defaultValue;

    //確認user存在
    let employeeCheck = firestore.collection(util.tables.users.tableName).doc(employeeUID).get().then(doc => {
        if (doc.exists === false) {
            return Promise.reject(`${employeeUID} does not exists`);
        }
        else {
            return Promise.resolve(doc);
        }

    }).then(doc => {
        return doc;
        //確認permition;
    });

    //確認user存在
    let employerCheck = firestore.collection(util.tables.users.tableName).doc(employerUID).get().then(doc => {
        if (doc.exists === false) {
            return Promise.reject(`${employerUID} does not exists`);
        }
        else {
            return Promise.resolve(doc);
        }
    }).then(doc => {
        return doc;
        //確認permitions
    });

    //寫入資料庫
    Promise.all([employeeCheck, employerCheck]).then(values => {
        let newRecord = {};
        newRecord[util.tables.punchRecord.columns.issuer] = values[0].id;
        newRecord[util.tables.punchRecord.columns.authorizer] = values[1].id;
        newRecord[util.tables.punchRecord.columns.punchTime] = Date.now();
        newRecord[util.tables.punchRecord.columns.modifyTime] = Date.now();

        return firestore.collection(util.tables.punchRecord.tableName).add(newRecord);
    }).then((loginTime) => {
        // 回傳成功
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason);
        response.json(resultObj);
    });

});

exports.addTeam = team.addTeam;
exports.deleteTeam = team.deleteTeam;
exports.getTeamList = team.getTeamList;

exports.addAnnouncement = announcement.addAnnouncement;
exports.getAnnouncement = announcement.getAnnouncement;
