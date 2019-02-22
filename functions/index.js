
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const team = require('./team');
const util = require('./util');
const announcement = require('./announcement');
admin.initializeApp();

const firestore = admin.firestore();
const auth = admin.auth();

exports.register = functions.https.onRequest((request, response) => {

    let resultObj = {
        excutionResult: 'fail',
    };

    //normalize
    let defaultValue = "";
    let _name = util.checkEmpty(request.body.name) ? request.body.name : defaultValue;
    let _phoneNumber = util.checkEmpty(request.body.phoneNumber) ? request.body.phoneNumber : defaultValue;
    let _gender = util.checkEmpty(request.body.gender) ? request.body.gender : defaultValue;
    let _jobTitle = util.checkEmpty(request.body.jobTitle) ? request.body.jobTitle : defaultValue;
    let _team = util.checkEmpty(request.body.team) ? request.body.team : defaultValue;
    let _workingType = util.checkEmpty(request.body.workingType) ? request.body.workingType : defaultValue;
    let _verified = false;
    let _permission = defaultValue;
    let _image = defaultValue;


    //確認gender存在

    //確認jobTitle存在？

    //確認team存在
    // if (_team === "") {
    //     console.log('team is empty');
    //     response.json(resultObj);
    //     return;
    // }
    // else {
    //     firestore.collection('team').doc(_team).get().then(doc => {
    //         if (doc.exists) {

    //         }
    //         else {
    //             console.log(request.body);
    //             console.log('team does not exist');
    //             response.json(resultObj);
    //             return;
    //         }
    //     });
    // }


    //response.json(resultObj);

    //確認workingType存在

    //確認phoneNumber 不為空
    //確認phoneNumber 不重複
    admin.auth().createUser({
        phoneNumber: _phoneNumber,
    }).then(userRecord => {
        console.log(userRecord);
        admin.firestore().collection('users').doc(userRecord.uid).set(
            {
                name: _name,
                phoneNumber: _phoneNumber,
                gender: _gender,
                jobTitle: _jobTitle,
                team: _team,
                workingType: _workingType,
                verified: _verified,
                permission: _permission,
                image: _image,
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

// exports.updateUser = functions.https.onRequest((request, response) => {

// });

// exports.addWork = functions.https.onRequest((request, response) => {

// });

// exports.getWork = functions.https.onRequest((request, response) => {

// });

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

exports.addAnnouncement = announcement.addAnnouncement;
exports.getAnnouncement = announcement.getAnnouncement;
