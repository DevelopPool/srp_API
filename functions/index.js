
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

exports.askLeave = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };
    defaultValue = " ";

    let issuerUID = util.checkEmpty(request.body.issuer) ? request.body.issuer : defaultValue;
    let type = util.checkEmpty(request.body.type) ? request.body.type : defaultValue;
    let desc = util.checkEmpty(request.body.desc) ? request.body.desc : defaultValue;
    let startLeaveTime = util.checkEmpty(request.body.startLeaveTime) ? request.body.startLeaveTime : defaultValue;
    let endLeaveTime = util.checkEmpty(request.body.endLeaveTime) ? request.body.endLeaveTime : defaultValue;

    let LeaveTimeCheck = new Promise((resolve, reject) => {


        if (!Number.isInteger(startLeaveTime)) {
            return reject('startLeaveTime format error');
        }

        if (!Number.isInteger(endLeaveTime)) {
            return reject('endLeaveTime format error');
        }
        if (startLeaveTime > endLeaveTime) {
            return reject('leave time order error');
        }
        return resolve('LeaveTimeCheck pass')
        // let startTime = new Date(startLeaveTime);
        // let endTime = new Date(endLeaveTime);
        // if (endTime < startTime) {
        //     return Promise.reject('endLeaveTime smaller than startLeaveTime');
        // }
        // else {
        //     return Promise.resolve();
        // }
    })

    let typeCheck = firestore.collection(util.tables.leaveType.tableName).doc(type).get().then(doc => {
        //leaveType是否存在
        if (!doc.exists) {
            return Promise.reject(`${type} does not exists`)
        }
        else {
            return Promise.resolve(doc);
        }
    });

    let issuerCheck = firestore.collection(util.tables.users.tableName).doc(issuerUID).get().then(doc => {
        //issuer是否存在
        if (!doc.exists) {
            return Promise.reject(`${issuerUID} does not exists`)
        }
        else {
            return Promise.resolve(doc);
        }
    });


    let today = Date.now();
    let date = new Date();
    today -= date.getMilliseconds();
    today -= date.getSeconds() * 1000;
    today -= date.getMinutes() * 60 * 1000;
    today -= date.getHours() * 60 * 60 * 1000;

    let issuerLoginCheck = firestore.collection(util.tables.loginRecord.tableName)
        .where(util.tables.loginRecord.columns.uid, '==', issuerUID)
        .where(util.tables.loginRecord.columns.loginTime, '>', new Date(today))
        .orderBy(util.tables.loginRecord.columns.loginTime, 'desc')
        .get().then(snapshot => {
            // snapshot.forEach(result=>{
            //     console.log(result.data());
            // })
            if (snapshot.empty) {
                return Promise.reject(`${issuerUID} login check fail`);
            }
            else {
                return Promise.resolve(`${issuerUID} login check pass`);
            }
        });

    Promise.all([issuerCheck, issuerLoginCheck, typeCheck, LeaveTimeCheck]).then(values => {
        //寫入資料庫
        let leaveNoteColumns = util.tables.leaveNote.columns;
        let newLeaveNote = {};
        newLeaveNote[leaveNoteColumns.issuer] = issuerUID;
        newLeaveNote[leaveNoteColumns.type] = type;
        newLeaveNote[leaveNoteColumns.issueTime] = Date.now();
        newLeaveNote[leaveNoteColumns.startLeaveTime] = new Date(startLeaveTime);
        newLeaveNote[leaveNoteColumns.endLeaveTime] = new Date(endLeaveTime);
        newLeaveNote[leaveNoteColumns.desc] = desc;
        console.log(newLeaveNote);
        return firestore.collection(util.tables.leaveNote.tableName).add(newLeaveNote);

    }).then(doc => {
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason);
        response.json(resultObj);
    });
});



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
        newRecord[util.tables.punchRecord.columns.punchTime] = new Date();
        newRecord[util.tables.punchRecord.columns.modifyTime] = new Date();

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
