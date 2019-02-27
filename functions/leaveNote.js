const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('./util');

const firestore = admin.firestore();


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

    //  驗證當天是否登入
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
        newLeaveNote[leaveNoteColumns.is_approved] = false;
        return firestore.collection(util.tables.leaveNote.tableName).add(newLeaveNote);

    }).then(doc => {
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason);
        response.json(resultObj);
    });
});

exports.getLeaveNoteList = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };
    defaultValue = " ";

    let uid = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue;
    let unAuthNotes = request.body.unAuthNotes;
    let authedNotes = request.body.authedNotes;
    let offset = util.checkEmpty(request.body.offset) ? request.body.offset : 0;
    let limit = util.checkEmpty(request.body.limit) ? request.body.limit : 10;

    let paraCheck = new Promise((resolve, reject) => {

        if (typeof (unAuthNotes) !== 'boolean') {
            return reject('parameter format error');
        }
        if (typeof (authedNotes) !== 'boolean') {
            return reject('parameter format error');
        }
        if (!unAuthNotes && !authedNotes) {
            return reject('parameter format error');
        }
        return resolve('parameter check pass');
    })

    let today = Date.now();
    let date = new Date();
    today -= date.getMilliseconds();
    today -= date.getSeconds() * 1000;
    today -= date.getMinutes() * 60 * 1000;
    today -= date.getHours() * 60 * 60 * 1000;

    let LoginCheck = firestore.collection(util.tables.loginRecord.tableName)
        .where(util.tables.loginRecord.columns.uid, '==', uid)
        .where(util.tables.loginRecord.columns.loginTime, '>', new Date(today))
        .orderBy(util.tables.loginRecord.columns.loginTime, 'desc')
        .get().then(snapshot => {

            if (snapshot.empty) {
                return Promise.reject(`${uid} login check fail`);
            }
            else {
                return Promise.resolve(`${uid} login check pass`);
            }
        });

    let uidCheck = firestore.collection(util.tables.users.tableName).doc(uid).get().then(doc => {
        //issuer是否存在
        if (!doc.exists) {
            return Promise.reject(`${uid} does not exists`)
        }
        else {
            return Promise.resolve(doc);
        }
    });

    //todo
    let permisionCheck = true;

    Promise.all([uidCheck, LoginCheck, permisionCheck, paraCheck]).then(values => {
        let query = firestore.collection(util.tables.leaveNote.tableName)
        if (!unAuthNotes && authedNotes) {
            console.log('gaga');
            return firestore.collection(util.tables.leaveNote.tableName)
                .where(util.tables.leaveNote.columns.is_approved, '==', true)
                .orderBy(util.tables.leaveNote.columns.authTime)
                .offset(offset)
                .limit(limit)
                .get();
        }
        else if (unAuthNotes && !authedNotes) {
            console.log('wuwu');

            return firestore.collection(util.tables.leaveNote.tableName)
                .where(util.tables.leaveNote.columns.is_approved, '==', false)
                .orderBy(util.tables.leaveNote.columns.issueTime )
                .offset(offset)
                .limit(limit)
                .get();
        }
        else {
            return firestore.collection(util.tables.leaveNote.tableName)
                .orderBy(util.tables.leaveNote.columns.issueTime)
                .offset(offset)
                .limit(limit)
                .get();
        }
    }).then(snapshot => {
        resultObj.leaveNote = [];
        snapshot.forEach(result => {
            resultObj.leaveNote.push(result.data());
        })
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason);
        response.json(resultObj);
    });


    //response.json(resultObj);

});


exports.authorizeAbsentNote = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };
    defaultValue = " ";


});