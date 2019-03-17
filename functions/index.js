
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
    // let workerExistCheck = firestore.collection(util.tables.users.tableName).get().then(snapshot => {
    //     userIDs = [];
    //     snapshot.forEach(result => {
    //         userIDs.push(result.id);
    //     })
    //     let flag = true;
    //     _worker.forEach(element => {
    //         //console.log(userIDs.includes(element));
    //         if (!userIDs.includes(element)) {
    //             flag = false;
    //         }

    //     })

    //     if (flag) {
    //         return Promise.resolve('worker check pass');
    //     }
    //     return Promise.reject('worker check fail');

    // })

    Promise.all([uidCheck, loginCheck, paracheck, teamCheck, "workerExistCheck", workTimeCheck]).then(valuse => {
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
    //todo 時區問題待修正
    let nowHour = new Date().getUTCHours() + 8;
    if (nowHour >= 24) {
        nowHour -= 24;
    }
    //todo testOnly
    nowHour = 8;


    let _uid = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue;

    //check user 存在
    let uidCheck = firestore.collection(util.tables.users.tableName).doc(_uid).get().then(doc => {
        if (!doc.exists) {
            return Promise.reject(`${_uid} does not exists`)
        }
        else {
            return Promise.resolve(doc);
        }
    });

    //login check
    let loginCheck = user.loginCheck(_uid);
    // let today = Date.now();
    // today -= new Date().getHours() * 60 * 60 * 1000;
    // today -= new Date().getMinutes() * 60 * 1000;
    // today -= new Date().getSeconds() * 1000;


    let workTime = firestore.collection(util.tables.workTime.tableName)
        .where(util.tables.workTime.columns.startHour, '<=', nowHour)
        .orderBy(util.tables.workTime.columns.startHour, 'desc')
        .limit(1)
        .get()
        .then(docs => {

            docID = ""
            docs.forEach(doc => {
                docID = doc.id;
            })

            return Promise.resolve(docID);
        })

    Promise.all([uidCheck, loginCheck, workTime]).then(values => {
        console.log(values[1]);
        //console.log(values[2]);
        //console.log(values[0].data()[util.tables.users.columns.phoneNumber]);

        let WAColumn = util.tables.workAssignment.columns;

        let users = firestore.collection(util.tables.users.tableName).get();
        let workAssignmets = firestore.collection(util.tables.workAssignment.tableName)
            .where(WAColumn.workTime, '==', values[2])
            .where(WAColumn.worker, 'array-contains', values[0].data()[util.tables.users.columns.phoneNumber])
            .where(WAColumn.modifyTime, '>=', new Date(util.getMidNightUTCSeconds()))
            .orderBy(WAColumn.modifyTime)
            .get();
        return Promise.all([users, workAssignmets])
    }).then((values) => {
        let users = values[0];
        let WAs = values[1];
        let returnWAs = [];
        let userDic = {}
        users.forEach(user => {
            let _data = user.data()
            userDic[_data.phoneNumber] = _data.name;
        })
        WAs.forEach((WA => {
            let _data = WA.data();
            let returnData = {};
            returnData['desc'] = _data.desc;
            returnData['modifyTime'] = _data.modifyTime;
            returnData['modifyUser'] = _data.modifyUser;
            returnData['team'] = _data.team;
            returnData['worker'] = [];
            _data.worker.map((phoneNumber) => {
                returnData['worker'].push(userDic[phoneNumber]);
            })
            returnWAs.push(returnData);
        }))
        // 回傳成功
        resultObj.excutionResult = 'success';
        resultObj['workAssignment'] = returnWAs;
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason);
        response.json(resultObj);
    });


});
//delete work

//todo permision check

exports.getMyLeaveNoteList = leaveNote.getMyLeaveNoteList;
exports.getLeaveNoteList = leaveNote.getLeaveNoteList;
exports.askLeave = leaveNote.askLeave;
exports.authorizeAbsentNote = leaveNote.authorizeAbsentNote;
exports.deleteMyLeaveNote = leaveNote.deleteMyLeaveNote;

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
exports.getMonthlyAttendanceRecord = functions.https.onRequest((request, response) => {

    let resultObj = {
        excutionResult: 'fail',
    };
    defaultValue = " ";


    let uid = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue;
    let mounth = util.checkEmpty(request.body.mounth) ? request.body.mounth : defaultValue;
    let year = util.checkEmpty(request.body.year) ? request.body.year : defaultValue;
    let _gender = util.checkEmpty(request.body.gender) ? request.body.gender : defaultValue;
    let paracheck = new Promise((resolve, reject) => {
        if (mounth === " ") {
            return reject('parameter format error , empty')
        }
        if (typeof (mounth) !== "number") {
            return reject('parameter format error , type error')
        }
        if (mounth < 1 || mounth > 12) {
            return reject('parameter format error , logic error')
        }
        if (year === " ") {
            return reject('parameter format error , empty')
        }
        if (typeof (year) !== "number") {
            return reject('parameter format error , type error')
        }

        return resolve('parameter check pass');
    });

    let genderCheck = firestore.collection(util.tables.gender.tableName).doc(_gender).get().then(snapshot => {
        if (snapshot.exists) {
            return Promise.resolve('gender exists');
        }
        else {
            return Promise.reject('gender does not exists');
        }
    });

    let uidCheck = user.uidCheck(uid);
    let loginCheck = user.loginCheck(uid);


    mounth--;
    nextMounth = mounth + 1;
    nextYear = year;
    if (nextMounth === 13) {
        nextMounth = 1;
        nextYear = year + 1;
    }


    Promise.all([uidCheck, loginCheck, paracheck, genderCheck]).then(() => {

        let punchRecord = firestore.collection(util.tables.punchRecord.tableName)
            .where(util.tables.punchRecord.columns.punchTime, '>=', new Date(year, mounth, 1))
            .where(util.tables.punchRecord.columns.punchTime, '<', new Date(nextYear, nextMounth, 1))
            .orderBy(util.tables.punchRecord.columns.punchTime)
            .get();

        let absendRecord = firestore.collection(util.tables.leaveNote.tableName)
            .where(util.tables.leaveNote.columns.startLeaveTime, '>=', new Date(year, mounth, 1))
            .where(util.tables.leaveNote.columns.startLeaveTime, '<', new Date(nextYear, 4, 1))
            .where(util.tables.leaveNote.columns.is_approved, '==', true)
            .orderBy(util.tables.leaveNote.columns.startLeaveTime)
            .get();


        let users = firestore.collection(util.tables.users.tableName)
            .where(util.tables.users.columns.gender, '==', _gender)
            .get();
        return Promise.all([punchRecord, absendRecord, users]);
    }).then((values) => {
        // 回傳成功
        let punchRecords = values[0];
        let absendRecords = values[1];
        let users = values[2];

        let tempData = {}
        users.forEach(user => {
            tempData[user.id] = {
                name: user.data().name,
                punch: [],
                leaveNote: [],
            }
        })

        punchRecords.forEach(punch => {
            let _p = punch.data()
            if (tempData[_p[util.tables.punchRecord.columns.issuer]] !== undefined) {
                tempData[_p[util.tables.punchRecord.columns.issuer]].punch.push(_p[util.tables.punchRecord.columns.punchTime]);

            }
        })

        absendRecords.forEach(ar => {
            let _ar = ar.data();
            if (tempData[_ar[util.tables.leaveNote.columns.issuer]] !== undefined) {
                tempData[_ar[util.tables.leaveNote.columns.issuer]].leaveNote.push({
                    startLeaveTime: _ar[util.tables.leaveNote.columns.startLeaveTime],
                    endLeaveTime: _ar[util.tables.leaveNote.columns.endLeaveTime],
                })
            }

        })
        returnData = []
        Object.keys(tempData).map(function (objectKey, index) {
            returnData.push({
                name: tempData[objectKey].name,
                punchRecord: tempData[objectKey].punch,
                leaveNote: tempData[objectKey].leaveNote
            })
            // var value = tempData[objectKey];
            // console.log(value);
        });
        resultObj.data = returnData;
        // punchRecords.forEach(punchRecord=>{
        //     console.log(punchRecord.data());
        // })
        // absendRecords.forEach(absendRecord => {
        //     console.log(absendRecord.data());
        // })
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
