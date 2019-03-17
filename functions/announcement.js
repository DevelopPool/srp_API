const functions = require('firebase-functions');
const admin = require('firebase-admin');
const util = require('./util');
const user = require('./user');
const cors = require('cors')({
    'origin': true,
});
//新增一筆公告事項
exports.addAnnouncement = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        let resultObj = {
            excutionResult: 'fail',
        };
        let defaultValue = " ";

        let title = util.checkEmpty(request.body.title) ? request.body.title : defaultValue;
        let _uid = util.checkEmpty(request.body.uid) ? request.body.uid : defaultValue;
        let detail = util.checkEmpty(request.body.detail) ? request.body.detail : defaultValue;

        let loginCheck = user.loginCheck(_uid);

        //todo 權限驗證

        Promise.all([loginCheck]).then(value => {
            let annCol = util.tables.announcement.columns;
            let newAnnouncement = {};
            newAnnouncement[annCol.title] = title;
            newAnnouncement[annCol.issueTime] = new Date();
            newAnnouncement[annCol.detail] = detail;
            newAnnouncement[annCol.issuer] = _uid;
            return admin.firestore().collection(util.tables.announcement.tableName)
                .add(newAnnouncement);
        }).then(docRef => {
            resultObj.excutionResult = 'success';
            response.json(resultObj);
        }).catch(reason => {
            response.json(resultObj);
        });
    })
});

//取得公告事項
exports.getAnnouncement = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        let resultObj = {
            excutionResult: 'fail',
        };
        // let today = Date.now();
        // let date = new Date();
        // today -= date.getMilliseconds();
        // today -= date.getSeconds() * 1000;
        // today -= date.getMinutes() * 60 * 1000;
        // today -= date.getHours() * 60 * 60 * 1000;

        let getUserInfo = admin.firestore().collection(util.tables.users.tableName)
            .get()
            .then(docs => {
                let users = {};
                docs.forEach(user => {
                    users[user.id] = user.data();
                })
                return Promise.resolve(users);
            });

        let getAnnouncement = admin.firestore().collection(util.tables.announcement.tableName)
            .orderBy(util.tables.announcement.columns.issueTime, 'desc')
            .limit(10)
            .get();

        Promise.all([getUserInfo, getAnnouncement]).then(values => {
            let users = values[0];
            let announcements = values[1];

            resultObj.announcement = [];
            announcements.forEach(doc => {
                let _doc = doc.data();
                let _announcement = {};
                _announcement.detail = _doc.detail;
                _announcement.issueTime = _doc.issueTime;
                _announcement.title = _doc.title;
                _announcement.issuer = users[_doc.issuer].name;
                resultObj.announcement.push(_announcement)
            });
            resultObj.excutionResult = 'success';
            response.json(resultObj);
        }).catch(reason => {
            console.log(reason);
            response.json(resultObj);
        })
    })
});