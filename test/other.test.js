import {isArray} from '../src/other';
import {expect} from 'chai';
describe('isArray()方法测试', function() {
    it('isArray()返回值类型是Boolean', () => {
        expect(isArray()).to.be.a('boolean');
    });

    it('isArray()可以测试数据是否是数组', () => {
        expect(isArray(3)).to.be.false;
        expect(isArray([1,2])).to.be.true;
    });
})