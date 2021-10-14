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

// let promise = null;

// (async () => {
//     const { signal, cancel } = createCancellableSignal();
//     promise = await wait(signal, 5000);
//     console.log('1');
//     console.log('2');
//     console.log('3');
//     // cancel();
// })();

// (async () => {
//     console.log('1');
//     console.log('2');
//     console.log(promise);
//     console.log('3');
//     // cancel();
// })();
