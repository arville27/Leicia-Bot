function wait(signal, ms) {
    return new Promise((res, rej) => {
        const timeOut = setTimeout(() => res('ok'), ms);
        signal.catch((err) => {
            rej(err);
            clearTimeout(timeOut);
        });
    });
}

function createCancellableSignal() {
    const ret = {};
    ret.signal = new Promise((resolve, reject) => {
        ret.cancelTimeout = () => {
            reject(new Error('Promise was cancelled'));
        };
    });

    return ret;
}

module.exports = { wait, createCancellableSignal };
