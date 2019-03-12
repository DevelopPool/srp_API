
//驗證資料是否為空
exports.checkEmpty = function checkEmpty(uncheckedValue) {
    if (uncheckedValue) {
        return true;
    }
    return false;
}

exports.tables = {
    workTime:{
        tableName:'workTime',
        columns:{
            showName:'showName',
            startHour:'startHour',
            endHour:'endHour',
        }
    },
    workAssignment: {
        tableName: 'workAssignment',
        columns: {
            team: 'team',
            workType: 'workType',
            workTime: 'worktime',
            desc: 'desc',
            worker: 'worker',
            modifyUser: 'modifyUser',
            modifyTime: 'modifyTime',
        }
    },
    leaveType: {
        tableName: 'leaveType',
        columns: {
            showName: 'showName',
        }
    },
    leaveNote: {
        tableName: 'leaveNote',
        columns: {
            issuer: "issuer",
            authorizer: "authorizer",
            issueTime: "issueTime",
            authTime: 'authTime',
            type: "type",
            desc: "description",
            startLeaveTime: "startLeaveTime",
            endLeaveTime: "endLeaveTime",
            is_approved: "is_approved",
            approve_desc: "approveDescription"
        }
    },
    punchRecord: {
        tableName: "punchRecord",
        columns: {
            issuer: "isser",
            authorizer: "authorizer",
            punchTime: "punchTime",
            modifyTime: "modifyTime"
        }
    },
    //todo
    users: {
        tableName: 'users',
        columns: {
            gender: 'gender',
            phoneNumber: 'phoneNumber',
            name: 'name',
            jobTitle: 'jobTitle',
            team: 'team',
            workingType: 'workingType',
            verified: 'verified',
            permitions: 'permitions',
            images: 'images',
        }
    },
    gender: {
        tableName: 'gender',
        columns: {
            showName: 'showName',
        }
    },
    team: {
        tableName: 'team',
    },
    hiringType: {
        tableName: 'workingType',
        columns: {
            showName: 'showName',
        }
    },
    loginRecord: {
        tableName: 'loginRecord',
        columns: {
            uid: 'uid',
            loginTime: 'loginTime',
            logoutMethod: 'logoutMethod',
            logoutTime: 'logoutTime'
        }
    },
}


