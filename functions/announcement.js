const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('./util');
const user = require('./user');
//新增一筆公告事項
exports.addAnnouncement = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };
    let defaultValue = " ";

    let title = util.checkEmpty(request.body.title) ? request.body.title : defaultValue;
    let _uid  = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue;
    let detail = util.checkEmpty(request.body.detail) ? request.body.detail : defaultValue;

    let loginCheck = user.loginCheck(_uid);

    //todo 權限驗證
    Promise.all([loginCheck]).then(value=>{
        return admin.firestore().collection('announcement').add({
            title: title,
            issueTIme: new Date(),
            detail: detail,
            issuer:_uid,
        })
    }).then(docRef => {
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        response.json(resultObj);
    });
});

//取得公告事項
exports.getAnnouncement = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };
    let today = Date.now();
    let date = new Date();
    today -= date.getMilliseconds();
    today -= date.getSeconds() * 1000;
    today -= date.getMinutes() * 60 * 1000;
    today -= date.getHours() * 60 * 60 * 1000;
   
    admin.firestore().collection('announcement').where('time',">",new Date(today)).orderBy('time', 'desc').get().then(snapshot => {
        resultObj.announcement = [];
        snapshot.forEach(doc => {
            resultObj.announcement.push( doc.data())
        });
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        response.json(resultObj);
    })
});