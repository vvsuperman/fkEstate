'use strict';

var _command = require('../command');

var _command2 = _interopRequireDefault(_command);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Command', function () {
    it('id to be randomly generated', function () {
        expect(new _command2.default().id).toEqual(jasmine.any(String));
    });

    it('id to be set correctly', function () {
        expect(new _command2.default('abc').id).toEqual('abc');
    });

    it('JSON.stringify(command) to be valid json', function () {
        expect(JSON.stringify(new _command2.default('1', 'target', 'name'))).toEqual('{"id":"1","target":"target","name":"name","params":[]}');
    });
});