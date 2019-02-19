
//驗證資料是否為空
exports.checkEmpty=function checkEmpty(uncheckedValue) {
    if (uncheckedValue) {
        return true;
    }
    return false;
}