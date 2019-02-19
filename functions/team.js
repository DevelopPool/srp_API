const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('./util');

//新增一筆團隊
exports.addTeam = functions.https.onRequest((request, response) => {
    let teamName = util.checkEmpty(request.body.teamName) ? request.body.teamName : "";
    let resultObj = {
        excutionResult: 'fail',
    };
    if (teamName !== "") {
        admin.firestore().collection('Team').doc(teamName).set({}).then(writeResult => {
            console.log(writeResult);
            resultObj.excutionResult = 'success';
            response.json(resultObj);
        }).catch(reason => {
            console.log(reason);
            response.json(resultObj);
        })
            ;
    }
});

//刪除團隊
exports.deleteTeam = functions.https.onRequest((request, response) => {
    let teamName = util.checkEmpty(request.body.teamName) ? request.body.teamName : "";
    let resultObj = {
        excutionResult: 'fail',
    };
    admin.firestore().collection('Team').doc(teamName).delete().then(writeResult => {
        console.log(writeResult);
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason);
        response.json(resultObj);
    })
});

//取得所有團隊
exports.getTeamList = functions.https.onRequest((request, response) => {
    console.log('getTeamList');
    let resultObj = {
        excutionResult: 'fail',
    };
    admin.firestore().collection('Team').get().then(snapShot => {
        resultObj.teamList = [];
        snapShot.forEach(doc => {
            resultObj.teamList.push(doc.id);
        })
        resultObj.excutionResult = 'success';
        response.json(resultObj);

    }).catch(reason => {
        console.log(reason);
        response.send('fail');

    })
});