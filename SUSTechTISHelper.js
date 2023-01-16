// ==UserScript==
// @name         SUSTech TIS Helper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  一个让妮可选课系统方便点的脚本
// @author       Froster
// @match        https://tis.sustech.edu.cn/Xsxk*
// @grant        GM_addStyle
// @grant        unsafeWindow
// @require      https://cdn.jsdelivr.net/gh/Fros1er/Timetable/Timetables.min.js
// ==/UserScript==

if (typeof unsafeWindow == 'undefined') {
    if ($('.ivu-table-header').length == 0) {
        let target = undefined
        let footer = $('.footer-main-list .mains-navbtn')
        for (let i = 0; i < footer.length; i++) {
            if (footer[i].innerHTML == "我要选课") {
                target = i
                break
            }
        }
        if (target != undefined) {
            unsafeWindow = window.frames[target]
        }
    } else {
        unsafeWindow = window
    }
}
if (typeof GM_addStyle != 'undefined') {
    GM_addStyle(`
/* The Modal (background) */
.modal {
  position: fixed; /* Stay in place */
  z-index: 10; /* Sit on top */
  padding-top: 5px; /* Location of the box */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0,0,0); /* Fallback color */
  background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

/* Modal Content */
.modal-content {
  position: relative;
  background-color: #fefefe;
  margin: auto;
  padding: 0;
  width: 80%;
  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
  -webkit-animation-name: animatetop;
  -webkit-animation-duration: 0.4s;
  animation-name: animatetop;
  animation-duration: 0.4s
}

/* Add Animation */
@-webkit-keyframes animatetop {
  from {top:-300px; opacity:0}
  to {top:0; opacity:1}
}

@keyframes animatetop {
  from {top:-300px; opacity:0}
  to {top:0; opacity:1}
}

/* The Close Button */
.close {
  color: white;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: #000;
  text-decoration: none;
  cursor: pointer;
}

.modal-header {
  padding: 2px 16px;
  height: 42px;
  background-color: #5cb85c;
  color: white;
}

.modal-title {
    padding-top: 6px;
    color: white;
  float: left;
  font-size: 20px;
  font-weight: bold;
}

.modal-body {padding: 2px 16px;}

.us-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  background: #FFF;
  padding: 22px;
  width: auto;
  max-width: 500px;
  z-index: 9999;
  transform: translate(-50%, -50%);
}

.us-popup-inner {
    margin: 0 22px;
}

.us-popup-close {
  cursor: pointer;
  background: transparent;
  border: 0;
  padding: 0;
  z-index: 10000;
  width: 44px;
  height: 44px;
  line-height: 44px;
  position: absolute;
  right: 0;
  top: 0;
  opacity: 0.65;
  font-size: 28px;
}

.us-popup-reader {
    overflow-y: scroll;
    max-height: 500px;
}
`);
}

function generatePopupDiv() {
    let popup = $("<div class='us-popup'></div>");
    let inner = $("<div class='us-popup-inner'></div>");
    let btn = $("<button type='button' class='us-popup-close'>×</button>");
    btn.on("click", () => {
        popup.hide();
    });
    popup.append(btn);
    popup.append(inner);
    popup.hide();
    return [popup, inner];
}

const timetableType = [
    [{ index: '1', name: '8:00' }, 1],
    [{ index: '2', name: '9:00' }, 1],
    [{ index: '3', name: '10:20' }, 1],
    [{ index: '4', name: '11:20' }, 1],
    [{ index: '5', name: '14:00' }, 1],
    [{ index: '6', name: '15:00' }, 1],
    [{ index: '7', name: '16:20' }, 1],
    [{ index: '8', name: '17:20' }, 1],
    [{ index: '9', name: '19:00' }, 1],
    [{ index: '10', name: '20:00' }, 1],
    [{ index: '11', name: '21:10' }, 1]
];
const week = ['周一', '周二', '周三', '周四', '周五'];

var timetable = undefined

var loadedCustomCourseTable = false

const weekday = { '一': 0, '二': 1, '三': 2, '四': 3, '五': 4 }

function genTimetableOption(isInit) {
    let res = {
        timetables: unsafeWindow.timetableArray,
        week: week,
        timetableType: timetableType,
        styles: {
            Gheight: ($(unsafeWindow).height() - 85) / 11,
            leftHandWidth: 30
        },
        gridOnClick: function (e) {
            if (unsafeWindow.lastClicked == e && e != '') {
                for (let i = 0; i < unsafeWindow.timetableArray.length; i++) {
                    for (let j = 0; j < unsafeWindow.timetableArray[i].length; j++) {
                        unsafeWindow.timetableArray[i][j] = unsafeWindow.timetableArray[i][j].filter(function (v) {
                            return v !== e
                        })
                    }
                }
                localStorage.setItem("timetableArray", JSON.stringify(unsafeWindow.timetableArray))
                unsafeWindow.timetable.setOption(genTimetableOption(false))
            }
            unsafeWindow.lastClicked = e
        }
    }
    if (isInit) {
        res.el = '#courseTable'
    }
    return res
}

function addBtn() {
    const rows = $('.ivu-table-body .ivu-table-row')
    if ($('td:first button', rows).length != 0) {
        return
    }
    if (!loadedCustomCourseTable) {
        if ($('.ivu-layout-header button').eq(6).length != 0) {
            let modal = $('<div class="modal"><div class="modal-content"> \
                <div class="modal-header"><span class="close">&times;</span> \
                <span class="modal-title">双击删除某门课</span></div>\
                <div class="modal-body" id="courseTable"></div></div></div>'
            )
            $('.close', modal).on('click', function () {
                modal.hide()
            })
            modal.on('click', function () {
                modal.hide()
            }).children().on('click', function (e) {
                e.stopPropagation();
            })
            let btn = $('<button class="ivu-btn ivu-btn-info"> \
                <span>暂存课表查看</span></button>'
            )
            btn.on('click', function () {
                modal.show()
                unsafeWindow.timetable.setOption(genTimetableOption(false))
            })
            let removeAllBtn = $('<button class="ivu-btn ivu-btn-info"> \
                <span>清空暂存课表</span></button>'
            )
            removeAllBtn.on('click', function () {
                if (confirm("确认清空暂存课表吗？")) {
                    unsafeWindow.timetableArray = [
                        [[], [], [], [], [], [], [], [], [], [], []],
                        [[], [], [], [], [], [], [], [], [], [], []],
                        [[], [], [], [], [], [], [], [], [], [], []],
                        [[], [], [], [], [], [], [], [], [], [], []],
                        [[], [], [], [], [], [], [], [], [], [], []]
                    ];
                    localStorage.setItem("timetableArray", JSON.stringify(unsafeWindow.timetableArray))
                }
            })
            $('.ivu-layout-header button').eq(6).after(removeAllBtn).after(btn)
            $('#app').append(modal)
            unsafeWindow.timetableArray = JSON.parse(localStorage.getItem("timetableArray")) || [
                [[], [], [], [], [], [], [], [], [], [], []],
                [[], [], [], [], [], [], [], [], [], [], []],
                [[], [], [], [], [], [], [], [], [], [], []],
                [[], [], [], [], [], [], [], [], [], [], []],
                [[], [], [], [], [], [], [], [], [], [], []]
            ];
            unsafeWindow.timetable = new Timetables(genTimetableOption(true))
            modal.hide();
            unsafeWindow.addToStashTable = function (btn) {
                const row = $('td', btn.parentNode.parentNode)
                let clsName = $('span', row[0]).html()
                let teacher = $('a', row[9]).html()
                const timeStrs = []
                if (clsName == "待生效") {
                    clsName = $('span', row[3]).html()
                    teacher = $('a', row[11]).html()
                    $('.ivu-tag-cyan p', row[11]).each(function () {
                        timeStrs.push(this.innerHTML)
                    })
                } else {
                    $('.ivu-tag-cyan p', row[9]).each(function () {
                        timeStrs.push(this.innerHTML)
                    })
                }

                let changed = false
                for (let s of timeStrs) {
                    let res = s.match("星期(.)第(\\d+\)-(\\d+)节")
                    for (let i = res[2] - 1; i < res[3]; i++) {
                        let name = clsName + ' ' + teacher
                        if (!unsafeWindow.timetableArray[weekday[res[1]]][i].includes(name)) {
                            unsafeWindow.timetableArray[weekday[res[1]]][i].push(name)
                            changed = true
                        }
                    }
                }
                if (changed) {
                    localStorage.setItem("timetableArray", JSON.stringify(unsafeWindow.timetableArray))
                }
            }
            loadedCustomCourseTable = true
        }
    }
    rows.each(function () {
        let btn = $('<button type="button" \
            class="ivu-btn ivu-btn-success ivu-btn-small"><span>暂存</span></button>')
        btn.on('click', function () {
            addToStashTable(this)
        })
        $('td:first', this).append(btn)
    })
}

(function () {
    'use strict';
    const divs = generatePopupDiv()
    const popup = divs[0], inner = divs[1]
    $('body').append(popup)
    let err = false
    if (typeof unsafeWindow == 'undefined') {
        inner.append("加载失败。如果您是在浏览器中直接导入的，请确保您的console是通过右键选课页面中除标题栏和底栏的位置打开的。<br />")
        err = true
    }
    if (typeof Timetables == 'undefined') {
        inner.append("课程表样式加载失败。请检查网络（或者挂个梯子试试？）<br />")
        err = true
    }
    if (err) {
        popup.show()
        return
    }
    setInterval(addBtn, 500)
})();
