const http$ = require('http');


const authTest = () => {
    console.log('auth test->', window.localStorage);
}


const auth = () => {
        const ls = window.localStorage;
        const MXInfo = ls['MXInfo'];
        const access_token = MXInfo ? MXInfo['access_token'] : null;
        return { access_token };
}

const login = ({loginName, password}) => {

}


exports.auth = auth;