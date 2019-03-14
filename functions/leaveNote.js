const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('./util');
const user = require('./user');
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

    // let issuerCheck = firestore.collection(util.tables.users.tableName).doc(issuerUID).get().then(doc => {
    //     //issuer是否存在
    //     if (!doc.exists) {
    //         return Promise.reject(`${issuerUID} does not exists`)
    //     }
    //     else {
    //         return Promise.resolve(doc);
    //     }
    // });
    let issuerCheck = user.uidCheck(issuerUID);

    //  驗證當天是否登入
    // let today = Date.now();
    // let date = new Date();
    // today -= date.getMilliseconds();
    // today -= date.getSeconds() * 1000;
    // today -= date.getMinutes() * 60 * 1000;
    // today -= date.getHours() * 60 * 60 * 1000;

    // let issuerLoginCheck = firestore.collection(util.tables.loginRecord.tableName)
    //     .where(util.tables.loginRecord.columns.uid, '==', issuerUID)
    //     .where(util.tables.loginRecord.columns.loginTime, '>', new Date(today))
    //     .orderBy(util.tables.loginRecord.columns.loginTime, 'desc')
    //     .get().then(snapshot => {

    //         if (snapshot.empty) {
    //             return Promise.reject(`${issuerUID} login check fail`);
    //         }
    //         else {
    //             return Promise.resolve(`${issuerUID} login check pass`);
    //         }
    //     });
    let issuerLoginCheck = user.loginCheck(issuerUID)

    Promise.all([issuerCheck, issuerLoginCheck, typeCheck, LeaveTimeCheck]).then(values => {
        //寫入資料庫
        let leaveNoteColumns = util.tables.leaveNote.columns;
        let newLeaveNote = {};
        newLeaveNote[leaveNoteColumns.issuer] = issuerUID;
        newLeaveNote[leaveNoteColumns.type] = type;
        newLeaveNote[leaveNoteColumns.issueTime] = new Date();
        newLeaveNote[leaveNoteColumns.startLeaveTime] = new Date(startLeaveTime);
        newLeaveNote[leaveNoteColumns.endLeaveTime] = new Date(endLeaveTime);
        newLeaveNote[leaveNoteColumns.desc] = desc;
        newLeaveNote[leaveNoteColumns.authorized] = false;
        //newLeaveNote[leaveNoteColumns.is_approved] = false;
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
    console.log("getHours=>"+new Date().getHours());
    console.log("getUTCHours=>"+new Date().getUTCHours());
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

    // let today = Date.now();
    // let date = new Date()
    // today -= date.getUTCMilliseconds();
    // today -= date.getUTCSeconds() * 1000;
    // today -= date.getUTCMinutes() * 60 * 1000;
    // let hour = date .getUTCHours() + 8;
    // if(hour >= 24){
    //     hour-=24;
    // }
    // today -= hour * 60 * 60 * 1000;

    // let loginCheck = firestore.collection(util.tables.loginRecord.tableName)
    //     .where(util.tables.loginRecord.columns.uid, '==', uid)
    //     .where(util.tables.loginRecord.columns.loginTime, '>', new Date(today))
    //     .orderBy(util.tables.loginRecord.columns.loginTime, 'desc')
    //     .get().then(snapshot => {
    //         snapshot.forEach(s=>{
    //             console.log(new Date(s.data().loginTime._seconds*1000));
    //         })


    //         if (snapshot.empty) {
    //             return Promise.reject(`${uid} login check fail`);
    //         }
    //         else {
    //             return Promise.resolve(`${uid} login check pass`);
    //         }
    //     });
    let loginCheck = user.loginCheck(uid);

    // let uidCheck = firestore.collection(util.tables.users.tableName).doc(uid).get().then(doc => {
    //     //issuer是否存在
    //     if (!doc.exists) {
    //         return Promise.reject(`${uid} does not exists`)
    //     }
    //     else {
    //         return Promise.resolve(doc);
    //     }
    // });
    let uidCheck = user.uidCheck(uid);


    //todo
    let permisionCheck = true;

    Promise.all([uidCheck, loginCheck, permisionCheck, paraCheck]).then(values => {
        let getLeaveNote = "";

        if (!unAuthNotes && authedNotes) {

            getLeaveNote = firestore.collection(util.tables.leaveNote.tableName)
                .where(util.tables.leaveNote.columns.authorized, '==', true)
                .orderBy(util.tables.leaveNote.columns.authTime)
                .offset(offset)
                .limit(limit)
                .get();
        }
        else if (unAuthNotes && !authedNotes) {


            getLeaveNote = firestore.collection(util.tables.leaveNote.tableName)
                .where(util.tables.leaveNote.columns.authorized, '==', false)
                .orderBy(util.tables.leaveNote.columns.issueTime)
                .offset(offset)
                .limit(limit)
                .get();
        }
        else {
            getLeaveNote = firestore.collection(util.tables.leaveNote.tableName)
                .orderBy(util.tables.leaveNote.columns.issueTime)
                .offset(offset)
                .limit(limit)
                .get();
        }

        let getUserInfo = firestore.collection(util.tables.users.tableName)
            .get()
            .then(docs => {
                let users = {};
                docs.forEach(user => {
                    users[user.id] = user.data();
                })
                return Promise.resolve(users);
            })

        return Promise.all([getLeaveNote, getUserInfo]);

    }).then(values => {
        let users = values[1];
        let leaveNotes = values[0];
        resultObj.leaveNote = [];

        leaveNotes.forEach(result => {

            leaveNote = result.data();
            let newData = {};
            newData.uid = result.id;
            newData.type = leaveNote.type;
            newData.startLeaveTime = leaveNote.startLeaveTime;
            newData.endLeaveTime = leaveNote.endLeaveTime;
            newData.issueTime = leaveNote.issueTime;
            newData.authorized = leaveNote.authorized;
            newData.is_approved = leaveNote.is_approved;
            newData.desc = leaveNote.description;
            newData.issuerName = users[leaveNote.issuer].name;
            console.log(leaveNote.is_approved);
            resultObj.leaveNote.push(newData);
        })
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason);
        response.json(resultObj);
    });


});


exports.authorizeAbsentNote = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };
    defaultValue = " ";

    let leaveNoteUID = util.checkEmpty(request.body.leaveNoteUID) ? request.body.leaveNoteUID : defaultValue;
    let authorizerUID = util.checkEmpty(request.body.authorizerUID) ? request.body.authorizerUID : defaultValue;
    let authDesc = util.checkEmpty(request.body.approve_desc) ? request.body.approve_desc : defaultValue;
    let is_proved = util.checkEmpty(request.body.is_proved) ? request.body.is_proved : defaultValue;

    //確認leaveNote存在

    //登入確認
    // let today = Date.now();
    // let date = new Date();
    // today -= date.getMilliseconds();
    // today -= date.getSeconds() * 1000;
    // today -= date.getMinutes() * 60 * 1000;
    // today -= date.getHours() * 60 * 60 * 1000;
    // let loginCheck = firestore.collection(util.tables.loginRecord.tableName)
    //     .where(util.tables.loginRecord.columns.uid, '==', authorizerUID)
    //     .where(util.tables.loginRecord.columns.loginTime, '>', new Date(today))
    //     .orderBy(util.tables.loginRecord.columns.loginTime, 'desc')
    //     .get().then(snapshot => {

    //         if (snapshot.empty) {
    //             return Promise.reject(`${authorizerUID} login check fail`);
    //         }
    //         else {
    //             return Promise.resolve(`${authorizerUID} login check pass`);
    //         }
    //     });
    let loginCheck = user.loginCheck(authorizerUID);

    //確認UID 存在
    // let uidCheck = firestore.collection(util.tables.users.tableName).doc(authorizerUID).get().then(doc => {
    //     if (!doc.exists) {
    //         return Promise.reject(`${authorizerUID} does not exists`)
    //     }
    //     else {
    //         return Promise.resolve(doc);
    //     }
    // })
    let uidCheck = user.uidCheck(authorizerUID);
    
    //權限確認 todo
    let permisionCheck = true;

    //確認prove型別
    let paraCheck = new Promise((resolve, reject) => {
        if (is_proved === null) {

            return reject('parameter format error');
        }
        if (typeof (is_proved) !== 'boolean') {
            console.log(is_proved);
            return reject('parameter type error');
        }
        return resolve('paraCheck pass');
    })

    Promise.all([paraCheck, permisionCheck, uidCheck, loginCheck]).then(values => {
       
        let leaveNoteColumns = util.tables.leaveNote.columns;
        let newData = {};
        newData[leaveNoteColumns.authTime] = new Date();
        newData[leaveNoteColumns.authorizer] = authorizerUID;
        newData[leaveNoteColumns.approve_desc] = authDesc;
        newData[leaveNoteColumns.is_approved] = is_proved;
        newData[leaveNoteColumns.authorized] = true;


        return firestore.collection(util.tables.leaveNote.tableName).doc(leaveNoteUID).update(newData);
    }).then(doc => {
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason);
        response.json(resultObj);
    });
});


exports.getMyLeaveNoteList = functions.https.onRequest((request, response) => {

    let resultObj = {
        excutionResult: 'fail',
    };
    defaultValue = " ";


    let uid = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue;


    let uidCheck = user.uidCheck(uid);
    let loginCheck = user.loginCheck(uid);

    Promise.all([uidCheck, loginCheck]).then(values => {
        let unAuthLNs = firestore.collection(util.tables.leaveNote.tableName)
            .where(util.tables.leaveNote.columns.issuer, '==', uid)
            .where(util.tables.leaveNote.columns.authorized, '==', false)
            .orderBy(util.tables.leaveNote.columns.issueTime, 'desc')
            .get();

        let futureLNs = firestore.collection(util.tables.leaveNote.tableName)
            .where(util.tables.leaveNote.columns.issuer, '==', uid)
            .where(util.tables.leaveNote.columns.is_approved, '==', true)
            .where(util.tables.leaveNote.columns.authorized,'==',true) 
            .where(util.tables.leaveNote.columns.startLeaveTime,'>=',new Date()) 
            .orderBy(util.tables.leaveNote.columns.startLeaveTime,'desc')
            .get();

        return Promise.all([unAuthLNs, futureLNs]);
    }).then(values => {
        let unAuthLNs = values[0];
        let futureLNs = values[1];

        let returnLNs = []
        unAuthLNs.forEach(LN => {
            let _LN = LN.data();
            _LN.id = LN.id;
            returnLNs.push(_LN);
            //console.log(LNs.data());
        })
        futureLNs.forEach(LN => {
            let _LN = LN.data();
            _LN.id = LN.id;
            returnLNs.push(_LN);
        })
        resultObj.leaveNotes=returnLNs;
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason);
        response.json(resultObj);
    });


});

// exports.deleteMyLeaveNote = functions.https.onRequest((request, response) => {

//     let resultObj = {
//         excutionResult: 'fail',
//     };
//     defaultValue = " ";


//     let uid = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue;
//     let LNid = util.checkEmpty(request.body.LeaveNoteID) ? request.body.LeaveNoteID : defaultValue;

//     let uidCheck = user.uidCheck(uid);
//     let loginCheck = user.loginCheck(uid);

//     Promise.all([uidCheck, loginCheck]).then(values => {
//         return firestore.collection(util.tables.leaveNote.tableName).doc(LNid).delete();
//     }).then(values => {
//         resultObj.excutionResult = 'success';
//         response.json(resultObj);
//     }).catch(reason => {
//         console.log(reason);
//         response.json(resultObj);
//     });


// });