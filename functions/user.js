const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('./util');


const firestore = admin.firestore();
const auth = admin.auth();

exports.register = functions.https.onRequest((request, response) => {

    let resultObj = {
        excutionResult: 'fail',
    };

    //normalize
    let defaultValue = " ";
    let _name = util.checkEmpty(request.body.name) ? request.body.name : defaultValue;
    let _phoneNumber = util.checkEmpty(request.body.phoneNumber) ? request.body.phoneNumber : defaultValue;
    let _gender = util.checkEmpty(request.body.gender) ? request.body.gender : defaultValue;
    let _jobTitle = util.checkEmpty(request.body.jobTitle) ? request.body.jobTitle : defaultValue;
    let _team = util.checkEmpty(request.body.team) ? request.body.team : defaultValue;
    let _workingType = util.checkEmpty(request.body.workingType) ? request.body.workingType : defaultValue;
    let _verified = false;
    let _permission = defaultValue;
    let _image = defaultValue;


    //確認firestore account 是否存在
    let firestoreAccount = firestore.collection(util.tables.users.tableName).where(util.tables.users.columns.phoneNumber, '==', _phoneNumber)
        .limit(1).get().then(snapshot => {
            if (snapshot.size === 0) {
                return false
            }
            else {
                return true;
            }

        });


    //確認gender存在
    let genderCheck = firestore.collection(util.tables.gender.tableName).doc(_gender).get().then(snapshot => {
        if (snapshot.exists) {
            return Promise.resolve('gender exists');
        }
        else {
            return Promise.reject('gender does not exists');
        }
    });

    //確認jobTitle存在？

    //確認team存在
    let teamCheck = firestore.collection(util.tables.team.tableName).doc(_team).get().then(snapshot => {
        if (snapshot.exists) {
            return Promise.resolve('team exists');
        }
        else {
            return Promise.reject('team does not exists');
        }
    });

    //確認workingType存在
    let workingTypeCheck = firestore.collection(util.tables.workingType.tableName).doc(_workingType).get().then(snapshot => {
        if (snapshot.exists) {
            return Promise.resolve('workingType exists');
        }
        else {
            return Promise.reject('workingType does not exists');
        }
    });

    //確認auth account 是否存在
    let accountExists = auth.getUserByPhoneNumber(_phoneNumber).then(userRecord => {
        return userRecord;
    }).catch(reason => {
        return false;
    });


    Promise.all([genderCheck, teamCheck, workingTypeCheck, accountExists, firestoreAccount]).then(value => {
        //firestore 帳號已經存在
        if (value[4] === true) {
            return Promise.reject({ log: "帳號已經存在" });
        }
        //如果auth帳號已經存在
        else if (value[3] !== false) {
            return firestore.collection(util.tables.users.tableName).doc(value[3].uid).set({
                name: _name,
                phoneNumber: _phoneNumber,
                gender: _gender,
                jobTitle: _jobTitle,
                team: _team,
                workingType: _workingType,
                verified: _verified,
                permission: _permission,
                image: _image,
            });
        }
        //都不存在
        else {
            return auth.createUser({
                phoneNumber: _phoneNumber,
            }).then(userRecord => {
                return firestore.collection(util.tables.users.tableName).doc(value[3].uid).set({
                    name: _name,
                    phoneNumber: _phoneNumber,
                    gender: _gender,
                    jobTitle: _jobTitle,
                    team: _team,
                    workingType: _workingType,
                    verified: _verified,
                    permission: _permission,
                    image: _image,
                });
            });
        }


    }).then(() => {
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason)
        response.json(resultObj);
    });

});


exports.checkLogin = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };

    let defaultValue = "";
    let uid = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue;

    auth.getUser(uid).then(userRecord => {

        // 確認 lastSignInTime存在
        if (userRecord.metadata.lastSignInTime === null) {
            return Promise.reject({ uid: userRecord.uid, log: "last Log In Time Null" });
        }
        else {
            //確認 時間合理 十分鐘以內
            let differSecond = (Date.now() - new Date(userRecord.metadata.lastSignInTime)) / 1000;
            console.log(differSecond);
            if (differSecond > 600) {
                return Promise.reject({ uid: userRecord.uid, log: "last Log In Time over 600 seconds" });
            }

            // 寫入 login record 
            return firestore.collection(util.tables.loginRecord.tableName).add({
                uid: userRecord.uid,
                loginTime: new Date(),
            })

        }
    }).then((loginTime) => {
        // 回傳成功
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason);
        response.json(resultObj);
    });

});

// exports.logout = functions.https.onRequest((request, response) => {
//     let resultObj = {
//         excutionResult: 'fail',
//     };

//     let defaultValue = "";
//     let uid = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue;

//     auth.getUser(uid).then(userRecord => {
//         //確認 loginRecord 存在
//         return firestore.collection(util.tables.loginRecord).where(util.tables.loginRecord.colunms.uid,'==',userRecord.uid).orderBy(util.tables.loginRecord.colunms.loginTime,"desc").limit(1).get();
//     }).then((snapshot=>{
//         console.log(snapshot);
//     })).then((loginTime) => {
//         resultObj.excutionResult = 'success';
//         response.json(resultObj);
//     }).catch(reason => {
//         console.log(reason);
//         response.json(resultObj);
//     });
// });

exports.updateUser = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };

    //normalize
    let defaultValue = " ";
    let _uid = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue; //動作帳號
    let _modifingUid = util.checkEmpty(request.body.modifingUid) ? request.body.modifingUid : defaultValue; //欲修改帳號
    let _name = util.checkEmpty(request.body.name) ? request.body.name : defaultValue;
    let _gender = util.checkEmpty(request.body.gender) ? request.body.gender : defaultValue;
    let _jobTitle = util.checkEmpty(request.body.jobTitle) ? request.body.jobTitle : defaultValue;
    let _team = util.checkEmpty(request.body.team) ? request.body.team : defaultValue;
    let _workingType = util.checkEmpty(request.body.workingType) ? request.body.workingType : defaultValue;
    let _verified = true;


    //確認gender存在
    let genderCheck = firestore.collection(util.tables.gender.tableName).doc(_gender).get().then(snapshot => {
        if (snapshot.exists) {
            return Promise.resolve('gender exists');
        }
        else {
            return Promise.reject('gender does not exists');
        }
    });

    //確認jobTitle存在？

    //確認team存在
    let teamCheck = firestore.collection(util.tables.team.tableName).doc(_team).get().then(snapshot => {
        if (snapshot.exists) {
            return Promise.resolve('team exists');
        }
        else {
            return Promise.reject('team does not exists');
        }
    });

    //確認workingType存在
    let workingTypeCheck = firestore.collection(util.tables.workingType.tableName).doc(_workingType).get().then(snapshot => {
        if (snapshot.exists) {
            return Promise.resolve('workingType exists');
        }
        else {
            return Promise.reject('workingType does not exists');
        }
    });

    //改自己
    if (_uid === _modifingUid) {
        Promise.all([genderCheck, teamCheck, workingTypeCheck]).then(value => {
            return firestore.collection(util.tables.users.tableName).doc(_uid).update({
                name: _name,
                gender: _gender,
                jobTitle: _jobTitle,
                team: _team,
                workingType: _workingType,
                verified: _verified,
            });
        }).then(() => {
            resultObj.excutionResult = 'success';
            response.json(resultObj);
        }).catch(reason => {
            console.log(reason)
            response.json(resultObj);
        });
    }
    //改別人
    else {
        let userCheck = _uidCheck(_uid);
        //todo permisionCheck
        Promise.all([genderCheck, teamCheck, workingTypeCheck, userCheck]).then(value => {
            return firestore.collection(util.tables.users.tableName).doc(_modifingUid).update({
                name: _name,
                gender: _gender,
                jobTitle: _jobTitle,
                team: _team,
                workingType: _workingType,
                verified: _verified,
            });
        }).then(() => {
            resultObj.excutionResult = 'success';
            response.json(resultObj);
        }).catch(reason => {
            console.log(reason)
            response.json(resultObj);
        });
    }





});

exports.getUserDetail = functions.https.onRequest((request, response) => {

    let resultObj = {
        excutionResult: 'fail',
    };
    defaultValue = " ";

    let _uid = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue;

    firestore.collection(util.tables.users.tableName).doc(_uid).get().then(doc => {
        if (doc.exists) {
            return Promise.resolve(doc);
        }
        else {
            return Promise.reject(`${_uid} does not exists.`);
        }
    }).then((doc) => {
        let data = doc.data();
        delete data.permission;
        resultObj.userData = data;
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason)
        response.json(resultObj);
    });


});

//get userlist
exports.getUserList = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };

    //normalize
    let defaultValue = " ";
    let _uid = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue;
    let loginCheck = _loginCheck(_uid)

    //todo permisionCheck


    Promise.all([loginCheck])
        .then(() => {
            return firestore.collection(util.tables.users.tableName).get()
        })
        .then(snapshot => {
            users = [];
            snapshot.forEach(result => {
                users.push(result.data());
            })
            return users;
        }).then((users) => {
            resultObj.excutionResult = 'success';
            resultObj.userList = users;
            response.json(resultObj);
        }).catch(reason => {
            console.log(reason)
            response.json(resultObj);
        });
});
//登入確認
exports.loginCheck = _loginCheck;

function _loginCheck(userID) {
    
    let today = Date.now();
    let date = new Date();
    today -= date.getMilliseconds();
    today -= date.getSeconds() * 1000;
    today -= date.getMinutes() * 60 * 1000;
    today -= date.getHours() * 60 * 60 * 1000;
    let loginCheck = firestore.collection(util.tables.loginRecord.tableName)
        .where(util.tables.loginRecord.columns.uid, '==', userID)
        .where(util.tables.loginRecord.columns.loginTime, '>', new Date(today))
        .orderBy(util.tables.loginRecord.columns.loginTime, 'desc')
        .get().then(snapshot => {

            if (snapshot.empty) {
                return Promise.reject(`${userID} login check fail`);
            }
            else {
                return Promise.resolve(`${userID} login check pass`);
            }
        });
    return loginCheck
}

exports.uidCheck = _uidCheck;

function _uidCheck(uid) {
    firestore.collection(util.tables.users.tableName).doc(uid).get().then(doc => {
        if (!doc.exists) {
            return Promise.reject(`${uid} does not exists`)
        }
        else {
            return Promise.resolve(doc);
        }
    })
}
