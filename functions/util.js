
//驗證資料是否為空
exports.checkEmpty = function checkEmpty(uncheckedValue) {
    if (uncheckedValue) {
        return true;
    }
    return false;
}

exports.tables = {
    users: {
        tableName: 'users',
        columns: {
            gender:'gender',
            phoneNumber:'phoneNumber'
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