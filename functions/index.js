
const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

function checkEmpty(uncheckedValue){
    if(uncheckedValue){
        return true;
    }
    return false;
}

exports.register = functions.https.onRequest((request, response) => {
    console.log(request.body);
    console.log( checkEmpty(request.body.name) ? request.body.name:defaultValue);



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


    admin.firestore().collection('users').add(
        {
            name: name,
            phoneNumber:phoneNumber,
            gender:gender,
            jobTitle:jobTitle,
            team:team,
            workingType:workingType,
            verified:verified,
            permission:permission,
            image:image,
        }).then(documentReference => {
        console.log(`Added document with name '${documentReference.id}'`);
      });
    response.send('ok');
 
});

exports.login=functions.https.onRequest((request, response) => {
    
});