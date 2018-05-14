'use strict';

import Base from './base.js';

export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction(){
    let demoConfig = think.extend([], this.config('demo'));
    let wss = demoConfig['wss'];
    let api = demoConfig['api'];
    let app = demoConfig['app'];
    let auth = demoConfig['auth'];
    let exp = parseInt((new Date).valueOf()/1000) + 7200;
    if (this.isAjax() && this.isPost()) {
      let key = this.post('key');
      let uid = this.post('uid');
      let txt = this.post('txt');
      let url = api + '/' + [auth, app, key].join('/');
      const request = require('superagent');
      let doSend = () => {
        let deferred = think.defer();
        let sendDataJson = ['user: '+uid.toString()+' send: '+txt];
        let sendDataText = JSON.stringify(sendDataJson);
        request.post(url).set('Content-Type', 'application/json').send(sendDataText).end(function (err, res) {
          if (res['ok'] && res['statusCode'] == 200) {
            if (think.isEmpty(res['body'])){
              deferred.reject({err: 9, msg: 'empty', data: undefined});
            } else {
              let body = res['body'];
              if (body.hasOwnProperty('err')) {
                deferred.resolve({err: body['err'], msg: body['msg'], data: ''});
              } else {
                deferred.resolve({err: 0, msg: 'ok', data: res['body']['data']['key']});
              }
            }
          } else {
            deferred.reject({err: 9, msg: 'empty', data: undefined});
          }
        });
        return deferred.promise;
      };
      let {err, msg, data} = await doSend();
      if (err > 0) return this.error(err, msg);
      return this.success(data);
    }
    // display ui
    let uid = this.get('uid');
    if (/^\d+$/.test(uid) == false) uid = 1;
    let options = demoConfig['jwt']['options'];
    let payload = {
      "wss": wss,
      "app": app,
      "uid": uid,
      "expires": exp
    };
    let JWT = new (think.service('jwt', {}, 'common'))();
    let {err, msg, data} = await JWT.sign(payload, auth, options).catch((err) => err);
    if (err > 0) {
      return this.error(err, msg);
    };
    payload['token'] = data;
    this.assign('payload', payload);
    this.assign('uid', uid);
    return this.display();
  }
}