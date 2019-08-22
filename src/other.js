export const isArray = (target) => {
	return Object.prototype.toString.call(target) === '[object Array]';
};