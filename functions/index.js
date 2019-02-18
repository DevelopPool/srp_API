
const functions = require('firebase-functions');

const admin = require('firebase-admin');
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

// exports.login = functions.https.onRequest((request, response) => {

// });

// exports.logout = functions.https.onRequest((request, response) => {

// });

// exports.addWork = functions.https.onRequest((request, response) => {

// });

// exports.getWork = functions.https.onRequest((request, response) => {

// });

exports.addAnnouncement = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };
    let defaultValue = "";
    let title = checkEmpty(request.body.title) ? request.body.title : defaultValue;
    let time = admin.firestore.Timestamp.now();
    let detail = checkEmpty(request.body.detail) ? request.body.detail : defaultValue;

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

exports.getAnnouncement = functions.https.onRequest((request, response) => {
    let resultObj = {
        excutionResult: 'fail',
    };
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

// exports.getAbsentNoteList = functions.https.onRequest((request, response) => {

// });

// exports.askLeave = functions.https.onRequest((request, response) => {

// });

// exports.authorizeAbsentNote = functions.https.onRequest((request, response) => {

// });

// exports.punch = functions.https.onRequest((request, response) => {

// });

exports.addTeam = functions.https.onRequest((request, response) => {

    let teamName = checkEmpty(request.body.teamName) ? request.body.teamName : "";
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

exports.deleteTeam = functions.https.onRequest((request, response) => {
    let teamName = checkEmpty(request.body.teamName) ? request.body.teamName : "";
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