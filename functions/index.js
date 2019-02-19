
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const team = require('./team');
const util = require('./util');
const announcement = require('./announcement');
admin.initializeApp();

function checkEmpty(uncheckedValue) {
    if (uncheckedValue) {
        return true;
    }
    return false;
}



exports.register = functions.https.onRequest((request, response) => {

    let resultObj = {
        excutionResult: 'fail',
    };
    //normalize
    let defaultValue = "";
    let name = checkEmpty(request.body.name) ? request.body.name : defaultValue;
    let phoneNumber = checkEmpty(request.body.phoneNumber) ? request.body.phoneNumber : defaultValue;
    let gender = checkEmpty(request.body.gender) ? request.body.gender : defaultValue;
    let jobTitle = checkEmpty(request.body.jobTitle) ? request.body.jobTitle : defaultValue;
    let team = checkEmpty(request.body.team) ? request.body.team : defaultValue;
    let workingType = checkEmpty(request.body.workingType) ? request.body.workingType : defaultValue;
    let verified = false;
    let permission = defaultValue;
    let image = defaultValue;

    //確認phoneNumber 不為空
    //確認phoneNumber 不重複
    //確認gender存在
    //確認jobTitle存在
    //確認team存在
    //確認workingType存在

    admin.auth().createUser({
        phoneNumber: phoneNumber,
    }).then(userRecord => {
        console.log(userRecord);
        admin.firestore().collection('users').doc(userRecord.uid).set(
            {
                name: name,
                phoneNumber: phoneNumber,
                gender: gender,
                jobTitle: jobTitle,
                team: team,
                workingType: workingType,
                verified: verified,
                permission: permission,
                image: image,
            })
    }).then(documentReference => {
        resultObj.excutionResult = 'success';
        response.json(resultObj);
    }).catch(reason => {
        console.log(reason)
        response.json(resultObj);
    });

});

// exports.checkLogin = functions.https.onRequest((request, response) => {

// });

// exports.logout = functions.https.onRequest((request, response) => {

// });

// exports.addWork = functions.https.onRequest((request, response) => {

// });

// exports.getWork = functions.https.onRequest((request, response) => {

// });

exports.addAnnouncement = announcement.addAnnouncement;

exports.getAnnouncement = announcement.getAnnouncement;

// exports.getAbsentNoteList = functions.https.onRequest((request, response) => {

// });

// exports.askLeave = functions.https.onRequest((request, response) => {

// });

// exports.authorizeAbsentNote = functions.https.onRequest((request, response) => {

// });

// exports.punch = functions.https.onRequest((request, response) => {

// });

exports.addTeam = team.addTeam;

exports.deleteTeam = team.deleteTeam;

exports.getTeamList = team.getTeamList;