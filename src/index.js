const isNumber = (num) => {
    return typeof num === 'number';
}

export const add = (...nums) => {
    if(!nums.every(n => isNumber(n))) throw new TypeError('params type need a number');
    return nums.reduce((prev, cur) => {
        return prev + cur;
    }, 0)
}