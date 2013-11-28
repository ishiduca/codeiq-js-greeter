;(function (global) {
    'use strict'
    var isBrowser = !! global.self
    var isWorker  = !! global.WorkerLocation
    var isNodeJS  = !! global.global

// 仕様1
    function Greeter () {
        this.greets = [
            'おはようございます'
          , 'こんにちは'
          , 'こんばんは'
        ]
        return this
    }

    Greeter.prototype.timeZoneOffset = -540// (new Date).getTimezoneOffset()
    Greeter.prototype.greet = function () {
        var now = new Date
        var jst = this.utcConvertJST(now.getUTCMinutes() + now.getUTCHours() * 60)
        return this.greets[this.getGreetsIndex(jst)]
    }
    Greeter.prototype.utcConvertJST = function (utcTime) {
        return ((60 * 24) + utcTime - this.timeZoneOffset) % (60 * 24)
    }
    Greeter.prototype.getGreetsIndex = function (time) {
        return time >= (60 * 18) ? 2
            :  time >= (60 * 12) ? 1
            :  time >= (60 *  5) ? 0 : 2
    }

// 仕様2
    function Greeeter (arg) {
        Greeter.call(this) // 将来変更がある場合に備えて
        if (arg === null || typeof arg === 'undefined') arg = {}
        if (Object.prototype.toString.apply(arg) !== '[object Object]')
            throw new TypeError('Greeeter(arg): "arg" must be "object"')

        this.greets = Greeeter.greets[this.getLocale(arg.locale)]
        return this
    }

// 拡張できるように
    Greeeter.greets = {
        en: [
            'Good Morning'
          , 'Good Afternoon'
          , 'Good Evening'
        ]
      , ja: [
            'おはようございます'
          , 'こんにちは'
          , 'こんばんは'
        ]
    }

// 継承させる
    var F = function () {}
    F.prototype = Greeter.prototype
    Greeeter.prototype = new F
    Greeeter.prototype.constructor = Greeeter

    Greeeter.prototype.getLocale = function (locale) {
        if (locale) isRegistered(locale)
        if (locale) return locale

        var lang
        if (isNodeJS && process && process.env && process.env.LANG)
            lang = process.env.LANG.slice(0, 2)

        if (isBrowser || isWorker) {
            lang = navigator && ( navigator.browserLanguage ||
                                  navigator.language        ||
                                  navigator.userLanguage
                                )
            if (lang) lang = lang.slice(0, 2)
        }

        if (lang) isRegistered(lang)
        if (lang) return lang

        return 'ja'

        function isRegistered (locale) {
            if (! Greeeter.greets[locale]) throw new TypeError(
              'Greeeter is not supported this locale - "' + locale + '"')
        }
    }


    if (isNodeJS) {
        module.exports.Greeter  = Greeter
        module.exports.Greeeter = Greeeter
    } else {
        global.Greeter  = Greeter
        global.Greeeter = Greeeter
    }

})(this.self || global)
