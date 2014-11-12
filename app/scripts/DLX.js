/**
 * Created by davidbreuer on 11/11/14.
 */
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
