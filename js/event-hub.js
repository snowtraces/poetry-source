window.eventHub = {
    events: {},
    emit(eventName, data) {
        let fnList = this.events[eventName]
        if (fnList) {
            fnList.map(fn => fn.call(undefined, data))
        }
    },
    on(eventName, fn) {
        (this.events[eventName] ||(this.events[eventName] = [])).push(fn)
        log(this.events)
    }
}