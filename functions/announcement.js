const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('./util');

//新增一筆公告事項
exports.addAnnouncement = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };
    let defaultValue = "";
    let title = util.checkEmpty(request.body.title) ? request.body.title : defaultValue;
    let time = admin.firestore.Timestamp.now();
    let detail = util.checkEmpty(request.body.detail) ? request.body.detail : defaultValue;

    admin.firestore().collection('announcement').add({
        title: title,
        time: time,
        detail: detail,
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

    //取第一筆
    admin.firestore().collection('announcement').orderBy('time', 'desc').limit(1).get().then(snapshot => {
        resultObj.announcement = {};
        snapshot.forEach(doc => {
            data = doc.data();
            resultObj.announcement.title = data.title;
            resultObj.announcement.time = data.time;
            resultObj.announcement.detail = data.detail;
            console.log(doc.data());
        });
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        response.json(resultObj);
    })
});