
//驗證資料是否為空
exports.checkEmpty = function checkEmpty(uncheckedValue) {
    if (uncheckedValue) {
        return true;
    }
    return false;
}

exports.tables = {
    leaveType:{
        tableName:'leaveType',
        columns:{
            showName:'showName',
        }
    },
    leaveNote: {
        tableName: 'leaveNote',
        columns: {
            issuer:"issuer",
            authorizer:"authorizer",
            issueTime:"issueTime",
            authTime:'authTime',
            type:"type",
            desc:"description",
            startLeaveTime:"startLeaveTime",
            endLeaveTime:"endLeaveTime",
            is_approved:"is_approved",
            approve_desc:"approveDescription"
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
    workingType: {
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