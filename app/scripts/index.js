'use strict';
document.addEventListener('DOMContentLoaded', function() {


    $.extend($.easing,{
        easeInBack: function(x,t,b,c,d,s) {
            s = s || 1.70158;
            return c*(t/=d)*t*((s+1)*t - s) + b;
        },
        easeOutBack: function(x,t,b,c,d,s) {
            s = s || 1.70158;
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
        }
    });

    var dlx = {
        dlx_cover : function (c){
            c.right.left = c.left;
            c.left.right = c.right;
            for (var i = c.down; i != c; i = i.down) {
                for (var j = i.right; j != i; j = j.right) {
                    j.down.up = j.up;
                    j.up.down = j.down;
                    j.column.size--;
                }
            }
        },

        dlx_uncover : function (c){
            for (var i = c.up; i != c; i = i.up) {
                for (var j = i.left; j != i; j = j.left) {
                    j.column.size++;
                    j.down.up = j;
                    j.up.down = j;
                }
            }
            c.right.left = c;
            c.left.right = c;
        },

        dlx_search : function (head, solution, k, solutions, maxsolutions){
            var that = this;
            if (head.right == head) {
                solutions.push(solution.slice(0));
                if (solutions.length >= maxsolutions) {
                    return solutions;
                }
                return null;
            }
            var c = null, s = 99999;

            for (var j = head.right; j != head; j = j.right) {
                if (j.size == 0) {
                    return null;
                }
                if (j.size < s) {
                    s = j.size;
                    c = j;
                }
            }
            that.dlx_cover(c);
            for (var r = c.down; r != c; r = r.down) {
                solution[k] = r.row;
                for (var j = r.right; j != r; j = j.right) {
                    that.dlx_cover(j.column);
                }
                var s = that.dlx_search(head, solution, k+1, solutions, maxsolutions);
                if (s != null) {
                    return s;
                }
                for (var j = r.left; j != r; j = j.left) {
                    that.dlx_uncover(j.column);
                }
            }
            that.dlx_uncover(c);
            return null;
        },

        dlx_solve : function (matrix, skip, maxsolutions){
            var columns = new Array(matrix[0].length);
            var col_len = columns.length;

            for (var i = 0; i < col_len; i++) {
                columns[i] = {};
            }
            for (var i = 0; i < col_len; i++) {
                columns[i].index = i;
                columns[i].up = columns[i];
                columns[i].down = columns[i];
                if (i >= skip) {
                    if (i-1 >= skip) {
                        columns[i].left = columns[i-1];
                    }
                    if (i+1 < col_len) {
                        columns[i].right = columns[i+1];
                    }
                } else {
                    columns[i].left = columns[i];
                    columns[i].right = columns[i];
                }
                columns[i].size = 0;
            }
            for (var i=0, matrix_len = matrix.length; i < matrix_len; i++) {
                var last = null;
                for (var j=0, matrix_i_len = matrix[i].length; j < matrix_i_len; j++) {
                    if (matrix[i][j]) {
                        var node = {};
                        node.row = i;
                        node.column = columns[j];
                        node.up = columns[j].up;
                        node.down = columns[j];
                        if (last) {
                            node.left = last;
                            node.right = last.right;
                            last.right.left = node;
                            last.right = node;
                        } else {
                            node.left = node;
                            node.right = node;
                        }
                        columns[j].up.down = node;
                        columns[j].up = node;
                        columns[j].size++;
                        last = node;
                    }
                }
            }
            var head = {},
                solutions = [];
            head.right = columns[skip];
            head.left = columns[col_len-1];
            columns[skip].left = head;
            columns[col_len-1].right = head;
            this.dlx_search(head, [], 0, solutions, maxsolutions);
            return solutions;
        },

        solve : function(grid){
            var mat = [];
            var rinfo = [];
            for (var i = 0; i < 9; i++) {
                for (var j = 0; j < 9; j++) {
                    var g = grid[i][j] - 1;
                    if (g >= 0) {
                        var row = new Array(324);
                        row[i*9+j] = 1;
                        row[9*9+i*9+g] = 1;
                        row[9*9*2+j*9+g] = 1;
                        row[9*9*3+(Math.floor(i/3)*3+Math.floor(j/3))*9+g] = 1;
                        mat.push(row);
                        rinfo.push({'row': i, 'col': j, 'n': g+1});
                    } else {
                        for (var n = 0; n < 9; n++) {
                            var row = new Array(324);
                            row[i*9+j] = 1;
                            row[9*9+i*9+n] = 1;
                            row[9*9*2+j*9+n] = 1;
                            row[9*9*3+(Math.floor(i/3)*3+Math.floor(j/3))*9+n] = 1;
                            mat.push(row);
                            rinfo.push({'row': i, 'col': j, 'n': n+1});
                        }
                    }
                }
            }

            var solutions = this.dlx_solve(mat, 0, 2);
            if (solutions.length > 0) {
                var r = solutions[0];
                for (var i = 0; i < r.length; i++) {
                    grid[rinfo[r[i]]['row']][rinfo[r[i]]['col']] = rinfo[r[i]]['n'];
                }
                return solutions.length;
            }
            return 0;
        }
    };

    self.addEventListener('message', function(e) {
        var data = dlx.solve( e.data );
        self.postMessage( data );
    }, false);

    var texts = {
        share: "Copy the link below to share the currently displayed board",
        exp: "This string represnt the board, with '0' as empty cell",
        imp: "Enter a string of 81 characters (blanks can be 0, or anything but a number)",
        import_invalid: "Your submission is invalid, please check again",
        board_invalid: "Invalid board: no single solution found",
        saveGame: "Game saved",
        loadGame: "Game loaded",
        newGame: "New game loaded",
        win: "You won! very impressive",
        loose: "Solution is not valid, please verify",
        pause: "Game paused",
        clear_cell: "Clear cell"
    }, options = {
        button: {
            levelMenu: $("header > div.output > ul"),
            undo: $("#options > button.undo"),
            restart: $("#options > button.restart"),
            newGame: $("#options > button.new"),
            notes: $("#options > button.notes"),
            note: $("#options > button.note"),
            clearNotes: $("#options > button.clearNotes"),
            save: $("#options_advanced > button.save"),
            load: $("#options_advanced > button.load"),
            Import: $("#options_advanced > button.import"),
            Export: $("#options_advanced > button.export"),
            share: $("#options_advanced > button.share"),
            set: function (a, b) {
                this[a].prop("disabled", b ? !1 : !0)
            }
        }, bind_buttons: function () {
            var a = this;
            $("#options > button").prop("disabled", !1);
            this.button.undo.bind("click", a.undo);
            this.undoToggle();
            this.button.restart.bind("click", $.proxy(a, "restart"));
            this.button.newGame.bind("click", $.proxy(a, "newGame"));
            this.button.Import.bind("click", function () {
                a.Import()
            });
            this.button.Export.bind("click", function () {
                a.Export()
            });
            this.button.share.bind("click", $.proxy(a, "share"));
            this.button.notes.bind("click", function () {
                a.candidates.set()
            });
            this.button.note.bind("click", function () {
                a.notes.set()
            });
            this.button.clearNotes.bind("click", function () {
                a.notes.remove()
            });
            utility.supports_html5_storage ? (this.button.save.bind("click", function () {
                a.save()
            }), this.button.load.bind("click", function () {
                a.load()
            }), localStorage && this.button.save.add(this.button.load).show(), localStorage && localStorage["sudoku.arr"] || this.button.load.prop("disabled", !0)) : this.button.save.add(this.button.load).hide();
            this.levelMenu()
        }, levelMenu: function () {
            var a = this.button.levelMenu;
            a.find("li").filter(function () {
                return $(this).text() == board.level
            }).addClass("on");
            a.on("click", "li", function (a) {
                a.stopPropagation();
                $(this).addClass("on").siblings(".on").removeClass("on");
                board.level = this.innerHTML;
                board.loadGameByLevel(board.level)
            })
        }, reset: function () {
            board.movesHistory.length = 0;
            this.candidates.remove();
            this.notes.remove();
            this.undoToggle();
            board.timer.restart()
        }, undo: function () {
            board.changeCell();
            board.movesHistory.splice(-1);
            options.undoToggle()
        }, undoToggle: function () {
            options.button.set("undo", 0 < board.movesHistory.length ? !0 : !1)
        }, restart: function () {
            this.reset();
            board.arr = $.extend(!0, [], board.arr_original);
            board.cells.find("> div span:first").empty();
            board.numberOfMoves = utility.countEmtpyCells()
        }, newGame: function () {
            window.location.search && (window.location.search = "");
            this.reset();
            options.button.set("newGame", 0);
            board.loadGameByLevel(board.level);
            utility.alert.say(texts.newGame + " (" + solver.score() + ")");
            board.spawnBoards(6);
            options.button.set("newGame", 1)
        }, save: function () {
            localStorage["sudoku.arr"] = JSON.stringify(board.arr);
            localStorage["sudoku.arr_original"] = JSON.stringify(board.arr_original);
            localStorage["sudoku.movesHistory"] = JSON.stringify(board.movesHistory);
            localStorage["sudoku.score"] = board.level;
            localStorage["sudoku.time"] = board.timer.hour + ":" + board.timer.min + ":" + board.timer.sec;
            this.button.load.prop("disabled", !1);
            utility.alert.say(texts.saveGame)
        }, load: function () {
            this.candidates.remove();
            this.notes.remove();
            this.undoToggle();
            board.arr = JSON.parse(localStorage["sudoku.arr"]);
            board.arr_original = JSON.parse(localStorage["sudoku.arr_original"]);
            board.movesHistory = JSON.parse(localStorage["sudoku.movesHistory"]);
            solver.setScore(localStorage["sudoku.score"]);
            var a;
            a = [];
            var b, c;
            for (b = 0; b < board.arr.length; b++)for (c = 0; c < board.arr[b].length; c++)board.arr[b][c] !== board.arr_original[b][c] && a.push([b, c]);
            a = a.sort();
            board.numberOfMoves = utility.countEmtpyCells();
            board.load({arr: board.arr, filledCells: a});
            board.timer.paused && board.timer.el.trigger("click");
            board.timer.set(localStorage["sudoku.time"]).go(!0);
            utility.alert.say(texts.loadGame)
        }, share: function () {
            var a = window.location.host + "?" + utility.flattenBoard(board.arr_original).join("");
            prompt(texts.share, a)
        }, Export: function () {
            var a = utility.flattenBoard(board.arr_original);
            prompt(texts.exp, a.join(""))
        }, Import: function (a) {
            if (a = a || prompt(texts.imp))if (81 != a.length)utility.alert.say(texts.import_invalid); else {
                var b, c = "";
                for (b = 0; 81 > b; b += 9)c += a.slice(b, b + 9), 70 > b && (c += ",");
                c = c.split(",");
                for (b = 9; b--;)for (c[b] = c[b].split(""), a = 9; a--;)c[b][a] = 0 == c[b][a] ? "" : c[b][a] | 0;
                b = c;
                1 != dlx.solve($.extend(!0, [], b)) && utility.alert.shout(texts.board_invalid);
                b = utility.transformArray(b);
                this.reset();
                board.load({arr: b});
                board.numberOfMoves = utility.countEmtpyCells();
                solver.init(b).step(0);
                solver.setScore()
            }
        }, notes: {
            possibilities: {}, toggle: !1, set: function () {
                this.toggle ? (this.toggle = !1, options.button.note.removeClass("on")) : (this.toggle = !0, options.candidates.toggle && options.candidates.set(), options.button.note.addClass("on"))
            }, update: function (a, b) {
                var c = this.possibilities;
                if (a in c) {
                    var d = c[a].indexOf(b);
                    -1 != d ? c[a].splice(d, 1) : c[a].push(b)
                } else c[a] = [b];
                c[a].sort()
            }, check: function (a, b) {
                a && (delete this.possibilities[b], board.cells.filter(function () {
                    return $(this).data("pos") == b
                }).find("table.candidates td").empty(), this.possibilities = analyzer.evaluatePosib.apply(this, [board]), this.render())
            }, render: function () {
                var a = this.possibilities, b, c, d;
                for (b in a)for (c = board.cells.not(".filled").filter(function () {
                    return $(this).data("pos") == b
                }), d = c.find("table.candidates td").empty(), c = 0; 9 > c; c++)d.eq(a[b][c] - 1).html(a[b][c])
            }, remove: function () {
                board.cells.length && (this.possibilities = {}, options.candidates.toggle && options.candidates.set(), board.cells.find("table.candidates td").empty())
            }
        }, candidates: {
            toggle: !1, set: function () {
                this.toggle ? this.remove() : (options.button.notes.addClass("on"), options.notes.toggle && options.notes.set(), this.render())
            }, render: function () {
                var a, b, c, d;
                this.toggle = !0;
                a = analyzer.evaluateTotal(board);
                board.cells.not(".filled").each(function () {
                    c = $(this).data("pos");
                    b = $(this).find("table.candidates td");
                    b.empty();
                    for (d = 0; 9 > d; d++)b.eq(a[c][d] - 1).text(a[c][d])
                })
            }, remove: function () {
                board.cells.length && (options.button.notes.removeClass("on"), board.cells.each(function () {
                    $(this).find("table.candidates td").empty()
                }), Object.keys(options.notes.possibilities).length && options.notes.render(), this.toggle = !1)
            }
        }
    }, utility = {
        alert: {
            alertObj: $("<div>").addClass("alert").append("<div>"),
            toggle: !1,
            timeout: null,
            value: null,
            say: function (a) {
                function b() {
                    c.alertObj.find("div").text(a);
                    clearTimeout(c.timeout);
                    c.timeout = window.setTimeout(function () {
                        c.hide()
                    }, 1500)
                }

                if (a) {
                    var c = this;
                    this.toggle && (c.alertObj.find("div").text(a), b());
                    this.toggle = !0;
                    this.value = a;
                    b();
                    this.render()
                }
            },
            shout: function (a) {
                var b = this, c = $("<button/>").html("&times;");
                c.bind("click", function () {
                    b.hide()
                });
                clearTimeout(this.timeout);
                this.alertObj.addClass("shout").find("div").text(a).append(c);
                this.render()
            },
            render: function () {
                this.alertObj.removeClass("hide").appendTo(document.body)
            },
            hide: function () {
                var a = this;
                this.toggle = !1;
                this.alertObj.addClass("hide");
                setTimeout(function () {
                    a.alertObj.remove().removeAttr("style")
                }, 500)
            }
        }, transformArray: function (a) {
            var b = [], c, d, e, f, h;
            for (d = 0; 3 > d; d++)for (e = 0; 3 > e; e++) {
                c = [];
                for (f = 0; 3 > f; f++)for (h = 0; 3 > h; h++)c.push(a[f + 3 * d][h + 3 * e]);
                b.push(c)
            }
            return b
        }, flatten: function (a) {
            return a.reduce(function (a, c) {
                return a.concat(c)
            })
        }, flattenBoard: function (a) {
            a = this.transformArray(a);
            a = this.flatten(a);
            for (var b = a.length; b--;)a[b] || (a[b] = 0);
            return a
        }, randomSort: function (a, b) {
            return 0 | 10 * Math.random() % 2
        }, supports_html5_storage: function () {
            try {
                return "localStorage"in window && null !== window.localStorage
            } catch (a) {
                return !1
            }
        }(), generateNumber: function (a) {
            a = a || [9, 1];
            return Math.random() * a[0] + a[1] >> 0
        }, countEmtpyCells: function (a) {
            a = a || board.arr;
            a = utility.flatten(a);
            return a.length - a.filter(Number).length
        }
    }, board = {
        mainBoard: null,
        level: "easy",
        cells: {},
        arr: [],
        arr_original: [],
        movesHistory: [],
        boards: [],
        numberOfMoves: 0,
        numOfBoards: 0,
        boardsReadyTimeout: 0,
        domFragments: {userCell: '<div><div><span></span></div><button title="' + texts.clear_cell + '">&times;</button></div>'},
        init: function (a) {
            this.container = a;
            this.mainBoard = this.generateMainTable();
            this.timer = new Timer;
            this.timer.init($("<time>").prependTo("#header").attr("title", "Click to pasue/play"));
            82 == window.location.search.length ? options.Import(window.location.search.split("?")[1], !0) : (this.games[this.level].sort(utility.randomSort), this.loadGameByLevel(this.level), this.spawnBoards(6));
            this.bindUserEvents();
            this.selectBox.init();
            options.bind_buttons();
            a.append(this.mainBoard)
        },
        spawnBoards: function (a) {
            a = a || 2;
            this.numOfBoards += a;
            var b = [], c;
            for (c = this.populate(); a--;)b[a] = new board.CreateGame, b[a].make({arr: c})
        },
        generateMainTable: function () {
            var a = this, b, c;
            b = this.makeTable();
            b.find("td").each(function (b) {
                c = a.makeTable(b).addClass("box b" + b);
                $(this).append(c)
            });
            return b
        },
        bindUserEvents: function () {
            var a = this, b, c, d, e, f, h;
            $(a.mainBoard).on("click", "td.user", a.cellClick).on("click", "td.user button", a.clearCell).on("mouseenter", "td.user", function (a) {
                b = $(a.currentTarget).data("pos")
            }).on("mouseleave", "td.user", function (a) {
                b = null
            });
            $(document).bind("keyup", function (g) {
                h = g.which;
                c = 58 > h && 48 < h;
                d = 106 > h && 96 < h;
                e = 46 == h || 110 == h;
                b && (a.selectBox.hide(), c || d ? (f = String.fromCharCode(96 <= h && 105 >= h ? h - 48 : h) | 0, options.notes.toggle ? a.changeNote(f, b) : a.changeCell(f, b)) : e && board.changeCell("", b), options.undoToggle())
            })
        },
        selectBox: function () {
            function a(a) {
                var b = e.arr[a[0]][a[1]];
                e.arr[a[0]][a[1]] = "";
                e.selectBox.obj.find("td").each(function (b) {
                    this.innerHTML = b + 1;
                    this.className = e.checkNumber(b + 1, a) ? "" : "disabled"
                });
                e.arr[a[0]][a[1]] = b
            }

            function b(a) {
                e.selectBox.obj.removeClass("show");
                $(document).off("click.selectBox", d)
            }

            function c(a) {
                var c = a.target.innerHTML | 0;
                a = $(a.target).parents("td.user").data("pos");
                options.notes.toggle ? e.changeNote(c, a) : e.changeCell(c, a);
                b()
            }

            function d(a) {
                a = $(a.target);
                if (a.hasClass("num_select") || a.parents("table").hasClass("num_select"))return !1;
                b()
            }

            var e;
            return {
                init: function () {
                    e = board;
                    this.obj = e.makeTable().addClass("num_select");
                    $(e.mainBoard).on("click", "table.num_select td:not(.disabled)", c)
                }, show: function (b, c) {
                    a(c);
                    $(b).children("div").append(e.selectBox.obj);
                    setTimeout(function () {
                        e.selectBox.obj.toggleClass("show");
                        $(document).on("click.selectBox", d)
                    }, 20)
                }, hide: b
            }
        }(),
        cellClick: function (a) {
            if (!$(a.target).closest("table").hasClass("num_select")) {
                var b = board;
                a = a.currentTarget;
                var c = $(a).data("pos");
                b.selectBox.obj.is(":visible") && b.selectBox.hide(0);
                b.selectBox.show(a, c)
            }
        },
        clearCell: function (a) {
            a.stopPropagation();
            a = $(a.target).closest("td.user").data("pos");
            board.changeCell("", a);
            options.undoToggle()
        },
        changeCell: function (a, b) {
            var c, d;
            arguments.length ? this.movesHistory.push([b, this.arr[b[0]][b[1]]]) : (b = this.movesHistory.slice(-1)[0][0], a = this.movesHistory.slice(-1)[0][1]);
            c = this.arr[b[0]][b[1]];
            this.arr[b[0]][b[1]] = a;
            d = board.cells.filter(function () {
                return $(this).data("pos") == b
            });
            a && d.find("> div span").text(a);
            a ? d.addClass("filled") : d.removeClass("filled");
            options.undoToggle();
            this.checkWin(c, a);
            options.notes.check(a, b);
            options.candidates.toggle && options.candidates.render()
        },
        checkWin: function (a, b) {
            a ? b || board.numberOfMoves++ : b && board.numberOfMoves--;
            if (board.numberOfMoves)return !1;
            for (var c = utility.flattenBoard(this.arr).join(""), d = 1; 9 >= d; d++)if (9 > c.split(d).length - 1)return utility.alert.say(texts.loose), !1;
            board.endGame()
        },
        changeNote: function (a, b) {
            var c, d;
            c = board.cells.filter(function () {
                return $(this).data("pos") == b
            });
            d = c.find("table.candidates td").eq(a - 1);
            c.removeClass("filled").find("> div span:first").text("");
            board.arr[b[0]][b[1]] = "";
            a = d.is(":empty") ? a : "";
            d.html(a);
            options.notes.update(b, a)
        },
        makeTable: function (a) {
            var b = $("<table>"), c, d, e, f;
            b.attr("cellpadding", 0).attr("cellspacing", 0);
            for (c = 0; 3 > c; c++)for (d = $("<tr>").appendTo(b), e = 0; 3 > e; e++)f = $("<td>"), a + 1 && f.data("pos", a + "" + (3 * c + e)), d.append(f);
            return b
        },
        populate: function () {
            for (var a = 0, b = [4, 9], c = []; 9 > c.push([]););
            for (var c = {arr: c}, d = [], e = 0; 9 > e; e++) {
                for (var f = 0; 9 > f; f++) {
                    a++;
                    b[1] = 9;
                    d.length = 0;
                    for (var h = utility.generateNumber(); !this.checkNumber.apply(c, [h, [e, f], !0]) && b[1];) {
                        a++;
                        if (5E4 < a)return;
                        -1 != d.indexOf(h) ? h = utility.generateNumber() : (d.push(h), h = utility.generateNumber(), b[1]--)
                    }
                    if (!b[1]) {
                        b[0]--;
                        c.arr[e].length = 0;
                        e = b[0] ? e - 1 : e - 2;
                        break
                    }
                    9 == f && (b[0] = 4);
                    c.arr[e][f] = h
                }
                b[0] || (b[0] = 4)
            }
            return c.arr
        },
        checkNumber: function (a, b, c) {
            var d = this, e, subRow;
            e = {
                square: function (b) {
                    return -1 != d.arr[b].join("").indexOf(a)
                }, row: function (b) {
                    if (0 == Math.ceil(b[0] % 3) && c)return !1;
                    var e, g;
                    e = Math.ceil(((b[0] | 0) + 1) / 3) - 1;
                    subRow = Math.ceil(((b[1] | 0) + 1) / 3) - 1;
                    for (b = 0; 3 > b; b++)for (g = 0; 3 > g; g++)if (a == d.arr[3 * e + b][3 * subRow + g])return !0;
                    return !1
                }, col: function (b) {
                    if (3 > b[0] && c)return !1;
                    var e, g, k;
                    e = Math.ceil((b[0] | 0) % 3);
                    b = Math.ceil((b[1] | 0) % 3);
                    for (g = 0; 3 > g; g++)for (k = 0; 3 > k; k++)if (a == d.arr[e + 3 * g][b + 3 * k])return !0;
                    return !1
                }
            };
            return -1 != d.arr[b[0] | 0].join("").indexOf(a) || e.row(b) || e.col(b) ? !1 : !0
        },
        removeItems: function (a) {
            a = a || {cells: 0};
            var b = a.arr || this.arr, c = [];
            do c[0] = utility.generateNumber() - 1, c[1] = utility.generateNumber() - 1; while ("" == b[c[0]][c[1]]);
            var d = [c, b[c[0]][c[1]], b[8 - c[0]][8 - c[1]]];
            b[c[0]][c[1]] = "";
            b[8 - c[0]][8 - c[1]] = "";
            1 < a.cells && this.removeItems({cells: --a.cells, arr: b});
            return d
        },
        load: function (a) {
            a = a || {};
            var b = a.filledCells || [], c = this.generateMainTable(), d = c.find("table.box"), e = this, f, h, g, k, l, m,len, n = this.mainBoard.data("timeout") || null, p = 200;
            this.arr = a.arr ? $.extend(!0, [], a.arr) : this.arr;
            this.arr_original = $.extend(!0, [], this.arr);
            this.mainBoard.addClass("hideCells");
            n && "placeholder"in document.createElement("input") ? (clearTimeout(n), n = null) : p = 0;
            n = setTimeout(function () {
                f = 0;
                for (len = e.arr.length; f < len; f++)for (g = d.eq(f), h = 0; h < len; h++)l = g.find("> tbody > tr > td").eq(h), k = board.arr[f][h], "" == k || 0 != b.length && f + "" + h == b[0].join("") ? (l.addClass("user").html(board.domFragments.userCell), "" != k && (l.addClass("filled").find("> div span:first").html(k), b.splice(0, 1))) : l.html("<span>" + board.arr[f][h] + "</span>").removeAttr("class");
                e.mainBoard.contents().replaceWith(c.contents());
                setTimeout(function () {
                    e.mainBoard.removeClass("hideCells")
                }, 50);
                board.cells = d.find("td.user");
                board.cells.each(function () {
                    m = board.makeTable().addClass("candidates");
                    this.children[0].appendChild(m[0])
                })
            }, p);
            this.mainBoard.data("timeout", n)
        },
        loadGameByLevel: function (a) {
            var b = this.games[a].pop();
            this.games[a].unshift(b);
            options.Import(b);
            this.spawnBoards(4)
        },
        endGame: function () {
            function a() {
                c += 0.15;
                d = utility.generateNumber([80, 0]);
                var f = b.eq(d);
                f.css("backgroundColor", "rgba(190, 190, 190,.24)");
                setTimeout(function () {
                    f.removeAttr("style")
                }, 200);
                e = setTimeout(a, c | 0)
            }

            var b, c, d, e;
            this.timer.stop();
            utility.alert.shout(texts.win);
            b = $("table.box > tbody > tr > td");
            c = 0;
            a();
            $("#options > button").prop("disabled", !0);
            setTimeout(function () {
                clearTimeout(e);
                $("#options > button").prop("disabled", !1)
            }, 5E3)
        },
        CreateGame: function () {
            this.make = function (a) {
                function b() {
                    a.arr = d;
                    f++;
                    if (2 == e) {
                        k--;
                        var b = d;
                        b[l[0][0]][l[0][1]] = l[1];
                        b[8 - l[0][0]][8 - l[0][1]] = l[2];
                        k ? g() : board.initCreatedGame(a)
                    } else 81 < f ? (console.warn("verifySolution: too much recursion"), board.initCreatedGame(a)) : g()
                }

                if (a && a.arr && a.arr.length) {
                    a.callback = a.callback || {};
                    var c = [], d = $.extend(!0, [], a.arr), e, f = 0, h, g, k = 16, l;
                    board.removeItems({cells: 8, arr: d});
                    window.Worker ? (h = new Worker("scripts/DLX.js"), g = function () {
                        l = board.removeItems({arr: d});
                        c = utility.transformArray(d);
                        h.postMessage(c)
                    }, h.addEventListener("message", function (a) {
                        e = a.data;
                        b()
                    }, !1)) : g = function () {
                        l = board.removeItems({arr: d});
                        c = utility.transformArray(d);
                        e = dlx.solve(c);
                        b()
                    };
                    g()
                } else console.warn("CreateGame: invalid options argument")
            }
        },
        initCreatedGame: function (a) {
            this.numOfBoards--;
            var b = a.arr;
            45 > utility.countEmtpyCells(b) ? (console.warn("generated board has too few moves. make a new game"), this.numOfBoards || this.boards.length || this.spawnBoards(2)) : (solver.init(b).step(0), this.boards.push([solver.grade, b]), this.addBoards(b), 1 == this.boards.length && 9 > this.arr.length && this.preloadBoard(a.callback))
        },
        preloadBoard: function (a) {
            var b = this;
            if (this.boards.length) {
                var c = this.boards[0];
                this.numberOfMoves = utility.countEmtpyCells(c[1]);
                this.load({arr: c[1]});
                solver.grade = c[0];
                solver.setScore();
                this.boards.splice(0, 1);
                this.timer.go();
                4 > this.numOfBoards && 4 > this.boards.length && this.spawnBoards(8);
                a && "function" === typeof a && a()
            } else this.boardsReadyTimeout = setTimeout(function () {
                b.preloadBoard(a)
            }, 150)
        },
        addBoards: function (a) {
            var b = solver.score();
            15 > this.games[b].length && (a = utility.flattenBoard(a).join(""), this.games[b].push(a))
        }
    }, solver = {
        init: function (a) {
            this.grade = this.steps = this.singles = 0;
            this.arr = a ? $.extend(!0, [], a) : $.extend(!0, [], board.arr);
            this.numberOfMoves = utility.countEmtpyCells(a);
            analyzer.evaluateTotal(solver);
            return this
        }, step: function (a) {
            var b = 0;
            switch (a) {
                case 0:
                    analyzer.evaluatePosib();
                    break;
                case 1:
                    analyzer.singleInBox();
                    break;
                case 2:
                    analyzer.singleInRowCol();
                    break;
                case 3:
                    b += analyzer.nakedPairsTriples();
                    break;
                case 4:
                    b += analyzer.hiddenPairsTriples();
                    break;
                default:
                    return !1
            }
            this.makeSingleMoves();
            this.grade += 10;
            2 == a && (this.grade += 10 * this.singles);
            3 < a && b && (this.grade += 10 * b);
            if (4 == a && !b || 0 == this.numberOfMoves)return this.grade += 30 * this.numberOfMoves, !1;
            150 < this.steps || (a = 0 < this.singles || 0 < b ? 0 : a + 1, this.step(a))
        }, makeSingleMoves: function () {
            this.steps++;
            this.singles = 0;
            var a = analyzer.possibilities, b;
            for (b in a)a.hasOwnProperty(b) && 1 === a[b].length && (this.singles++, this.numberOfMoves--, this.advance(b, a[b][0]), delete a[b])
        }, advance: function (a, b) {
            this.arr[a[0]][a[1]] = b
        }, score: function (a) {
            a = "very easy";
            1400 < this.grade ? a = "extreme" : 1200 < this.grade ? a = "very tough" : 900 < this.grade ? a = "tough" : 350 < this.grade ? a = "medium" : 150 < this.grade && (a = "easy");
            return a
        }, setScore: function (a) {
            a = a || this.score();
            $("div.output:first > span").text(a).attr({"data-value": solver.grade, title: "more or less"}).hide().show(0)
        }
    }, analyzer = {
        possibilities: {}, evaluateTotal: function (a) {
            var b = this.possibilities = {}, c, d, e;
            for (c = 0; 9 > c; c++)for (d = 0; 9 > d; d++)if ("" == a.arr[c][d])for (b[c + "" + d] = [], e = 1; 10 > e; e++)board.checkNumber.apply(a, [e, [c, d]]) && b[c + "" + d].push(e);
            return b
        }, evaluatePosib: function (a) {
            var b = this.possibilities, c, d, e;
            a = a || solver;
            for (c in b)for (d = b[c].length; d--;)!1 === board.checkNumber.apply(a, [b[c][d], [c[0] | 0, c[1] | 0]]) && (e = b[c].indexOf(b[c][d]), b[c].splice(e, 1));
            return b
        }, singleInBox: function () {
            var a = this.possibilities, b = Object.keys(a)[0][0], c = this.boxPosib = [{}], d;
            for (d in a)d[0] != b && (b = d[0], c.push({})), c[c.length - 1][d] = a[d];
            for (a = c.length; a--;)this.hiddenSingles(c[a])
        }, singleInRowCol: function () {
            for (var a = this.possibilities, b = this.colPosib = [], c = this.rowPosib = [], d = 9; d--;)b.push({}), c.push({});
            for (var e in a) {
                var d = 3 * Math.ceil(e[0] % 3) + Math.ceil(e[1] % 3), f = 3 * (Math.ceil(((e[0] | 0) + 1) / 3) - 1) + (Math.ceil(((e[1] | 0) + 1) / 3) - 1);
                b[d][e] = a[e];
                c[f][e] = a[e]
            }
            for (d = 0; 9 > d; d++)this.hiddenSingles(b[d]), this.hiddenSingles(c[d])
        }, hiddenSingles: function (a) {
            var b = "", c;
            for (c in a)b += a[c].join("");
            for (c in a)for (var d = a[c].length; d--;) {
                var e = a[c][d];
                if (b.indexOf(e) == b.lastIndexOf(e)) {
                    this.possibilities[c] = [e];
                    break
                }
            }
        }, nakedPairsTriples: function () {
            for (var a = 0, b = 9; b--;)a += this.findNakedPairs(this.rowPosib[b]) + this.findNakedPairs(this.colPosib[b]) + this.findNakedPairs(this.boxPosib[b]) + this.findNakedTriples(this.rowPosib[b]) + this.findNakedTriples(this.colPosib[b]) + this.findNakedTriples(this.boxPosib[b]);
            return a
        }, hiddenPairsTriples: function () {
            for (var a = 0, b = 9; b--;)a += this.findHiddenPairsTriples(this.rowPosib[b]) + this.findHiddenPairsTriples(this.colPosib[b]) + this.findHiddenPairsTriples(this.boxPosib[b]);
            return a
        }, findNakedPairs: function (a) {
            if ("object" != typeof a || 3 > Object.keys(a).length)return 0;
            var b = [], c = 0, d;
            for (d in a)2 == a[d].length && b.push(d);
            d = b.length;
            for (var e = 0; e < d; e++)for (var f = e + 1; f < d; f++)if (2 == a[b[e]].length && a[b[e]].join("") == a[b[f]].join("")) {
                var h = a[b[e]].join(""), g;
                for (g in a)if (g != b[e] && g != b[f])for (var k = a[g].length; k--;)-1 != h.indexOf(a[g][k]) && (c++, this.possibilities[g].splice(k, 1))
            }
            return c
        }, findNakedTriples: function (a) {
            if ("object" != typeof a || 4 > Object.keys(a).length)return 0;
            var b = [], c = 0, d;
            for (d in a)4 > a[d].length && b.push(d);
            d = [];
            for (var e = b.length, f = 0; f < e; f++)for (var h = f + 1; h < e; h++)for (var g = h + 1; g < e; g++) {
                d.push(b[f], b[h], b[g]);
                for (var k = "", l = d.length; l--;)for (var m = a[d[l]].length; m--;) {
                    var n = a[d[l]][m];
                    -1 == k.indexOf(n) && (k += n)
                }
                if (3 == k.length)for (l in a)if (-1 == d.indexOf(l))for (m = a[l].length; m--;)-1 != k.indexOf(a[l][m]) && (c++, this.possibilities[l].splice(m, 1));
                d.length = 0
            }
            return c
        }, findHiddenPairsTriples: function (a) {
            function b(a, b) {
                for (var e = a.length; e--;)c.possibilities[d[a[e]]] = $.extend(!0, [], b)
            }

            var c = this, d = [], e = "", f = [], h = 0, g;
            for (g in a)d.push(g), e += a[g].join("");
            for (g = 0; g < d.length; g++)for (var k = g + 1; k < d.length; k++) {
                for (var l = f.length = 0; l < a[d[g]].length; l++) {
                    var m = a[d[g]][l];
                    4 < a[d[g]].length + a[d[k]].length && 3 == e.split(m).length && -1 != a[d[k]].indexOf(m) && f.push(m);
                    if (2 == f.length) {
                        h++;
                        b([g, k], f);
                        break
                    }
                }
                for (var n = k + 1; n < d.length; n++)for (l = f.length = 0; l < a[d[g]].length; l++)if (m = a[d[g]][l], 9 < a[d[g]].length + a[d[k]].length + a[d[n]].length && 4 == e.split(m).length && -1 != a[d[k]].indexOf(m) && -1 != a[d[n]].indexOf(m) && f.push(m), 3 == f.length) {
                    h++;
                    b([g, k, n], f);
                    break
                }
            }
            return h
        }
    }, Timer = function () {
    };
    Timer.prototype = {
        refresh: null, focus: null, sec: 0, min: 0, hour: 0, paused: !1, init: function (a) {
            this.el = a;
            this.clickEvent();
            return this
        }, set: function (a) {
            a = a.split(":");
            this.hour = a[0];
            this.min = a[1];
            this.sec = a[2];
            return this
        }, bindFocus: function () {
            var a = this;
            clearInterval(this.focus);
            document.hasFocus && (a.focus = setInterval(function () {
                document.hasFocus() ? a.paused && (window.clearInterval(this.refresh), a.go()) : a.stop()
            }, 200))
        }, clickEvent: function () {
            var a = this, b = $("<h2>").addClass("pauseGame").text(texts.pause), c = !0;
            this.el.bind("click", function (d) {
                c && (c = !1, !1 === a.paused ? (a.stop(), window.clearInterval(a.focus), $("#options > button").prop("disabled", !0), board.mainBoard.fadeOut(400, function () {
                    b.css({letterSpacing: "25px", opacity: 0});
                    $(this).after(b).detach();
                    b.parent().addClass("paused");
                    b.animate({opacity: 1}, {
                        queue: !1,
                        duration: 400
                    }).animate({letterSpacing: "-4px"}, 700, "easeOutBack", function () {
                        c = !0
                    })
                }), a.el.addClass("pause")) : ($("#options > button").prop("disabled", !1), options.undoToggle(), b.animate({
                    opacity: 0,
                    letterSpacing: "25px"
                }, 600, "easeInBack", function () {
                    $(this).parent().removeClass("paused").end().remove();
                    board.container.prepend(board.mainBoard).removeAttr("style");
                    board.mainBoard.fadeIn(400);
                    a.go();
                    c = !0
                }), this.className = ""))
            })
        }, restart: function (a) {
            this.sec = this.min = this.hour = 0;
            this.el.text("00:00");
            this.stop().go()
        }, go: function (a) {
            function b() {
                c.sec++;
                60 == c.sec && (c.sec = 0, c.min++);
                10 > c.sec && (c.sec = "0" + c.sec);
                60 == c.min && (c.min = 0, c.hour++);
                c.el.html((0 < c.hour ? (9 >= c.hour ? "0" + c.hour : c.hour) + ":" : "") + (9 >= c.min ? "0" + c.min : c.min) + ":" + c.sec)
            }

            var c = this;
            this.paused = !1;
            a && b();
            window.clearInterval(this.refresh);
            c.refresh = window.setInterval(b, 1E3);
            return this
        }, stop: function () {
            this.paused = !0;
            window.clearInterval(this.refresh);
            return this
        }
    };

    board.games = {
        'very easy':	['040730800007090305036480000210500000000000000000008012000074280604050700008013090',
            '502001009100000040000485007000009078069000450470300000300974000090000001700600504',
            '040031069007000045030400000200000670800000003075000002000004080690000700720610090',
            '400000062000004001002509040304000500200806007005000206040608100500200000920000008',
            '000300902600004001180000740000100089000856000870003000043000025500200004906005000',
            '050000080410097000006050903000000092395208471640000000501020800000910057030000020',
            '000400070170900082600500040000049300900356008006270000060005001810004029090002000']
        ,
        'easy':			['057081002030000000000500040304070580290000037075040206040008000000000090900410370',
            '000000002609704000082500043300002500000806000005900006740008120000207604900000000',
            '500030000210004300034700800743060002009020500800070634008009250005300091000050008',
            '502001000000000040030080007200009078800107003470300002300070080090000000000600504',
            '000001809187090300906480007010009000009020400000300010300074206004050731708600000',
            '500700009000200340000005120010040608009000400405060010051900000094002000700003004',
            '000700860100200040000485000003009670009000400075300900000974000090002001028003000',
            '007000060630000801080500000004070589001050400875040200000008020508000094020000300']
        ,
        'medium':		['002001060000206300000085107210509000060000050000308012301970000004802000020600500',
            '002700000000000045900085007210540000000020000000068012300970006690000000000003500',
            '000301060630020850002500040300000500290000037005000006040008100018030094020405000',
            '200600704003800060080052000100045000090000070000170008000720040020006300907004006',
            '003006040040307001897200000070000003031000470500000010000008257300705090080900300',
            '040000091500001002000040700012008000900030005000900120009080000600300004250000060',
            '000900370000052006913007000800000600050030010009000003000100782100580000086009000',
            '000040000956000000000010079085400700340050062002001450820060000000000185000090000',
            '300040600002390100650010070006000740000060000025000900040030015007051300003020007',]
        ,
        'tough':		['000006072000007650620005890000080040006203900080070000069400027042700000750900000',
            '080040600072090000609210000006000042730000081820000900000037205000050390003020060',
            '600000008750004000002670000491500000080030040000008157000042700000800034900000002',
            '040000008000080001802005090000507380007000200026408000030900705200060000900000010',
            '050600000000090205706000000170345602300060001602179038000000809804010000000004020',
            '000500610001800004060000598100008060506020801090600003974000050600005400085009000',
            '008500090500004703006903004001600800000080000003001400200305600307100002050006300',
            '408007090000800700000000504001030005700409006600050400209000000007008000050200307',
            '000000002050803070002560010305100700000070000004005209040052100090608030500000000']
        ,
        'very tough':	['806700090000000004000500813005190008000204000700085200643002000200000000080007906',
            '005300709092000500000007060003609008000204000900105400060400000004000920508002300',
            '008560090092800060100003000901600070000000000080001409000300008060008950050096300',
            '020039040905070036430000007000200300000050000002007000800000064740080502050790010',
            '100650409002007000000100080009008060200305008040900500080006000000500700605079004',
            '080020304340000009000400570900600800051090740004007002015004000700000085408070090',
            '080040609072000108000008070100503000000962000000104006040600000207000390503020060',
            '050301062000700050180009043060002009000050000800900010740600025010007000920405070',
            '003200570000080001002005003490500006507000209300008057100900700200060000064003800']
        ,
        'extreme':		['500001060080206040000000107013009008000127000400300910301000000090802030020600004',
            '000700069000006300000085120010000608009020400405000010051970000004800000720003000',
            '807520000000000402000049050002000940900030005085000100030280000601000000000017309',
            '000600109000000070030705020700060002060423080800070004070109050020000000301007000',
            '007009100000400030000062900089000370104000609062000480001320000040001000006700800',
            '000000100010070006008062050009006001000803000300900400090320700700080090006000000',
            '600000000010070036000100957089206000000050000000907480891005000740080090000000003',
            '000700620400090050009008070090080740000060000025070030040600200060050004013009000']
    };
    // load the Sudoku game into this container
    board.init( $('#board_cont > div') );



}, false);
