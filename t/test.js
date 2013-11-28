;(function (global) {
    'use strict'
    var isBrowser = !! global.self
    var isWorker  = !! global.WorkerLocation
    var isNodeJS  = !! global.global

    if (! isNodeJS) setupBrowser(global)

    var q, Greeter, Greeeter
    if (isNodeJS) {
        q = req('qunit/driver')
        Greeter  = req('..').Greeter
        Greeeter = req('..').Greeeter
    } else {
        q = global.QUnit
        Greeter  = global.Greeter
        Greeeter = global.Greeeter
    }

    suites(q, Greeter, '仕様1')

    suites(q, Greeeter, '仕様2')
    extSuites(q, Greeeter, isNodeJS)

})(this.self || global)

function suites (q, Greeter, mes) {
    mes += ': '

    q.module(mes + 'モジュールの読み込み')
    q.test('モジュールの読み込みはできているか', function (t) {
        t.ok(Greeter, 'Greeter ok')
        t.ok((new Greeter).greet, 'greeter.greet ok')
    })

    q.module(mes + 'ヘルパーメソッド')
    q.test('.utcConvertJST(utcTime)はUTCの時刻をAsia/Tokyo時刻で返すか', function (t) {
        var greeter = new Greeter

        t.is(greeter.utcConvertJST(0), 540, 'utc: 00:00 -> jst: 09:00')
        t.is(greeter.utcConvertJST(1), 541, 'utc: 00:01 -> jst: 09:01')
        t.is(greeter.utcConvertJST(900), 0, 'utc: 15:00 -> jst: 00:00')
        t.is(greeter.utcConvertJST(1380), 480, 'utc: 23:00 -> jst: 08:00')
        t.is(greeter.utcConvertJST(1440), 540, 'utc: 24:00 -> jst: 09:00')
        t.is(greeter.utcConvertJST(1500), 600, 'utc: 25:00 -> jst: 10:00')
    })
    q.test('.getGreetsIndex(time)はJSTから得た時間に対応したインデックスを返すか', function (t) {
        var greeter = new Greeter

        t.is(greeter.getGreetsIndex(1081), 2, '18:01 -> 2')
        t.is(greeter.getGreetsIndex(1080), 2, '18:00 -> 2')
        t.is(greeter.getGreetsIndex(1079), 1, '17:59 -> 1')
        t.is(greeter.getGreetsIndex(721),  1, '12:01 -> 1')
        t.is(greeter.getGreetsIndex(720),  1, '12:00 -> 1')
        t.is(greeter.getGreetsIndex(719),  0, '11:59 -> 0')
        t.is(greeter.getGreetsIndex(301),  0, ' 5:01 -> 0')
        t.is(greeter.getGreetsIndex(300),  0, ' 5:00 -> 0')
        t.is(greeter.getGreetsIndex(299),  2, ' 4:59 -> 2')
    })

    q.module(mes + '.greet', {
        setup: function () {
            var stub = this.stub = {}
            this.getUTCHours   = Date.prototype.getUTCHours
            this.getUTCMinutes = Date.prototype.getUTCMinutes
            Date.prototype.getUTCHours   = function () { return stub.hour }
            Date.prototype.getUTCMinutes = function () { return stub.min }
        }
      , teardown: function () {
            Date.prototype.getUTCHours   = this.getUTCHours
            Date.prototype.getUTCMinutes = this.getUTCMinutes
            this.sub = null
        }
    })
    q.test('*stubが期待通りの動作をするか', function (t) {
        var d = new Date
        var stub = this.stub
        stub.hour = 'foo'
        stub.min  = 'bar'

        t.is(d.getUTCHours(), 'foo', 'd.getUTCHours() = "foo"')
        t.is(d.getUTCMinutes(), 'bar', 'd.getUTCMinutes() = "bar"')
    })
    q.test('.greet()は時刻に寄って適切な挨拶を返すか', function (t) {
        var stub = this.stub
        var greeter = (Greeter.greets) ? (new Greeter({locale: 'ja'})) : (new Greeter)
        function subt (gmtHour, min, result, mes) {
            stub.hour = gmtHour
            stub.min  = min
            t.is(greeter.greet(), result, mes)
        }

        subt( 0,  0, 'おはようございます', '09:00 -> おはようございます')
        subt( 2, 59, 'おはようございます', '11:59 -> おはようございます')
        subt( 3,  0, 'こんにちは', '12:00 -> こんにちは')
        subt( 8, 59, 'こんにちは', '17:59 -> こんにちは')
        subt( 9,  0, 'こんばんは', '18:00 -> こんばんは')
        subt(15,  0, 'こんばんは', '24:00 -> こんばんは')
        subt(19, 59, 'こんばんは', '04:59 -> こんばんは')
        subt(20, 00, 'おはようございます', '05:00 -> おはようございます')
    })
}

function extSuites (q, Greeeter, isNodeJS) {
    q.module('仕様2: new')
    q.test('new Greeeter(arg) で引数の型が違っていた場合、エラーを投げるか', function (t) {
        t.throws(function () { new Greeeter('ja') }
          , /"arg" must be "object"/
          , 'new Greeeter("ja") 引数が 文字列なのでエラー'
        )

        t.throws(function () { new Greeeter({locale: 'zh'}) }
          , /is not supported/
          , 'new Greeeter({locale: "zh"}) "zh" ロケールはサポートしていないのでエラー'
        )
    })
    q.test('new Greeter({locale: "en"})はエラーを投げずにインスタンスを生成するか', function (t) {
        var greeter = new Greeeter({locale: 'en'})
        t.ok(greeter.greets, 'greeter.greets ok')
        t.is(greeter.greets[0], 'Good Morning', 'greeter.greets[0] - "Good Morning"')
    })
    q.test('new Greeter({locale: "ja"})はエラーを投げずにインスタンスを生成するか', function (t) {
        var greeter = new Greeeter({locale: 'ja'})
        t.ok(greeter.greets, 'greeter.greets ok')
        t.is(greeter.greets[0], 'おはようございます', 'greeter.greets[0] - "おはようございます"')
    })

    q.module('仕様2: .getLocale(_locale)')
    q.test('new Greeeter で環境に応じたロケールを取得できるか', function (t) {
        var peLang, nbLang
        if (isNodeJS) {
            peLang = process.env.LANG
        } else {
            nbLang = navigator.browserLanguage
        }

        function setEnv (lang) {
            if (isNodeJS) {
                process.env.LANG = lang
            } else {
                navigator.browserLanguage = lang
            }
        }
        function subt (lang, result, mes) {
            setEnv(lang)
            var greeter = new Greeeter
            t.is(greeter.greets[0], result, mes)
        }

        subt('ja_JP.UTF-8', 'おはようございます', 'lang: "ja_JP.UT-8" -> greeter.greets[0] = "おはようございます"')
        subt('en-US', 'Good Morning', 'lang: "en-US" -> greeter.greets[0] = "Good Morning"')

        setEnv('zh-tw')
        t.throws(function () {new Greeeter}
          , /is not supported/
          , 'lang: "zh-tw" -> サポートしていないロケールなのでエラーを投げる'
        )

        if (isNodeJS) {
            process.env.Lang = peLang
        } else {
            navigator.browserLanguage = nbLang
        }
    })
}


function setupBrowser (global) {
    global.console || (global.console = {})
    global.console.log || (global.console.log = function () {})

    var q = QUnit, t = q.assert
    qunitTap(q, function () { console.log.apply(console, arguments) })
    t.like = function (str, reg, mes) { this.ok(reg.test(str), mes) }
    t.is   = t.strictEqual
}
function req (p) { return require(require('path').join(__dirname, p)) }
