
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const team = require('./team');
const util = require('./util');
const user = require('./user');
const announcement = require('./announcement');
const leaveNote = require('./leaveNote');

const firestore = admin.firestore();
const auth = admin.auth();

exports.register = user.register;
exports.checkLogin = user.checkLogin;
// exports.logout = user.logout;
exports.updateUser = user.updateUser;
exports.getUserDetail = user.getUserDetail;
exports.getUserList = user.getUserList;
exports.addWork = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };

    defaultValue = " ";
    let _team = util.checkEmpty(request.body.team) ? request.body.team : defaultValue;
    let _workType = util.checkEmpty(request.body.workType) ? request.body.team : defaultValue;
    let _workTime = util.checkEmpty(request.body.workTime) ? request.body.workTime : defaultValue;
    let _desc = util.checkEmpty(request.body.desc) ? request.body.desc : defaultValue;
    let _worker = util.checkEmpty(request.body.worker) ? request.body.worker : [];
    let _uid = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue;

    //check user 存在
    let uidCheck = user.uidCheck(_uid);

    //login check
    let loginCheck = user.loginCheck(_uid);

    //確認team存在
    let teamCheck = team.check.teamExistCheck(_team);

    let workTimeCheck = firestore.collection(util.tables.workTime.tableName).get().then(docs => {
        docIDs = [];
        docs.forEach(doc => {
            docIDs.push(doc.id);
        });
        return docIDs;
    })
        .then(docIDs => {
            if (!docIDs.includes(_workTime)) {
                return Promise.reject('workTime format error')
            }
            return Promise.resolve('workTime checkpass');
        })
    let paracheck = new Promise((resolve, reject) => {

        if (_workType === " ") {
            return reject('workType format error')
        }
        return resolve('parameter check pass');
    });
    //  todo
    let workerExistCheck = firestore.collection(util.tables.users.tableName).get().then(snapshot => {
        userIDs = [];
        snapshot.forEach(result => {
            userIDs.push(result.id);
        })
        let flag = true;
        _worker.forEach(element => {
            //console.log(userIDs.includes(element));
            if (!userIDs.includes(element)) {
                flag = false;
            }

        })

        if (flag) {
            return Promise.resolve('worker check pass');
        }
        return Promise.reject('worker check fail');

    })

    Promise.all([uidCheck, loginCheck, paracheck, teamCheck, workerExistCheck, workTimeCheck]).then(valuse => {
        let WAColumn = util.tables.workAssignment.columns;
        let newAssignment = {};
        newAssignment[WAColumn.team] = _team;
        newAssignment[WAColumn.workType] = _workType;
        newAssignment[WAColumn.workTime] = _workTime;
        newAssignment[WAColumn.desc] = _desc;
        newAssignment[WAColumn.worker] = _worker;
        newAssignment[WAColumn.modifyUser] = _uid;
        newAssignment[WAColumn.modifyTime] = new Date();
        return firestore.collection(util.tables.workAssignment.tableName).add(newAssignment)
    }).then(() => {
        // 回傳成功
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason);
        resultObj.reason = reason;
        response.json(resultObj);
    });
});

exports.getWork = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };

    defaultValue = " ";

    let nowHour = new Date().getHours();
    let _uid = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue;

    //check user 存在
    let uidCheck = user.uidCheck(_uid);

    //login check
    let loginCheck = user.loginCheck(_uid);

    let today = Date.now();
    today -= new Date().getHours() * 60 * 60 * 1000;
    today -= new Date().getMinutes() * 60 * 1000;
    today -= new Date().getSeconds() * 1000;


    let workTime = firestore.collection(util.tables.workTime.tableName)
        .where(util.tables.workTime.columns.startHour, '<=', nowHour)
        .orderBy(util.tables.workTime.columns.startHour, 'desc')
        .limit(1)
        .get()
        .then(docs => {

            docID = ""
            docs.forEach(doc => {
                console.log(doc.data());
                docID = doc.id;
            })

            return Promise.resolve(docID);
        })

    Promise.all([uidCheck, loginCheck, workTime]).then(values => {
        let WAColumn = util.tables.workAssignment.columns;
        return firestore.collection(util.tables.workAssignment.tableName)
            .where(WAColumn.workTime, '==', values[2])
            .where(WAColumn.worker, 'array-contains', _uid)
            .where(WAColumn.modifyTime, '>=', new Date(today))
            .orderBy(WAColumn.modifyTime)
            .get()
    })
        .then((snap) => {

            let WA = []
            snap.forEach((result => {
                WA.push(result.data());
            }))
            // 回傳成功
            resultObj.excutionResult = 'success';
            resultObj['workAssignment'] = WA;
            response.json(resultObj);
        }).catch(reason => {
            console.log(reason);
            response.json(resultObj);
        });


});
//delete work

//todo permision check
exports.getLeaveNoteList = leaveNote.getLeaveNoteList;
exports.askLeave = leaveNote.askLeave;



exports.authorizeAbsentNote = leaveNote.authorizeAbsentNote;

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
