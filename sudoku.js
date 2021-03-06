var my_sudoku;


//============================================================
function setup() {

  createCanvas(windowHeight, windowHeight);
  
  frameRate(1);
  this.base = 3
  this.nrc = false
  this.jigsaw = true; 

  my_sudoku = new sudoku(this.base, this.nrc )
  

  this.gui = new dat.GUI();
  this.gui.add(this, "base", [2, 3, 4])
  this.gui.add(this, "nrc")
  this.gui.add(this, "jigsaw")
  this.gui.add(this, "create")
  var gui_inp = this.gui.addFolder('special')
  this.sudoku_str = "4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......"
  gui_inp.add(this, "solve_input_sudoku")
  gui_inp.add(this, "sudoku_str")

}

function create() {
  var iterations
  var start = Date.now()
  my_sudoku = new sudoku(parseInt(this.base), this.nrc, this.jigsaw )
  iterations = my_sudoku.solve();
  console.log ( " creation " + iterations)
  my_sudoku.consoleLog()
  iterations = my_sudoku.swipe();
  var end = Date.now()
  console.log( " swiped " + iterations + " d_time " + (end - start)/1000 + " it_time: " + iterations/(end - start))
  my_sudoku.consoleLog()
  my_sudoku.consoleLog2()


}

function solve_input_sudoku() {
  console.log("solving on request")
  my_sudoku = new sudoku(3, false)
  my_sudoku.setSudokuStr(this.sudoku_str)
  my_sudoku.solve();
}

//============================================================
function draw() {
  var canv_size ;
  if (windowWidth < windowHeight) {
    canv_size = windowWidth
  } else{
    canv_size = windowHeight 
  }
  my_sudoku.draw(canv_size-20)

}


//============================================================
function windowResized() {
  resizeCanvas(windowHeight, windowHeight);
}

//============================================================
class sudoku {
  constructor(base, nrc_trick, jigsaw) {
    this.base = base
    this.depth = base*base;
    this.cell_cnt = this.depth*this.depth;
    this.jigsaw = jigsaw

    // create all cells
    this.cells = new Array(this.depth)
    this.cells_all = new Array(this.cell_cnt)
    for (var r = 0; r < this.depth; r++) {
      this.cells[r] = new Array(this.depth)
      for ( var c = 0; c < this.depth ; c++) {
        this.cells[r][c] = new Cell(this.depth, r,c);
        this.cells_all[r*this.depth + c] = this.cells[r][c]
      }
    }

    //create line fields (arrays of cells)
    for (var r = 0 ; r < this.depth; r++){
      var field = new Field("column")
      for ( var c = 0; c < this.depth ; c++) {
        field.addCell(this.cells[r][c])
        this.cells[r][c].addField(field)
      }
    }
    for (var c = 0 ; c < this.depth; c++){
      var field = new Field("row")
      for ( var r = 0; r < this.depth ; r++) {
        field.addCell(this.cells[r][c])
        this.cells[r][c].addField(field)
      }
    }
    var square_fields = []
    var colors1 = [[color("red"), color("blue"), color("green")],
                  [color("yellow"), color("magenta"), color("cyan")],
                  [color("white"), color("purple"), color("orange")]];
    var colors = []
    for ( var r = 0; r < this.base; r ++) {
      var col_row = [] 
      for ( var c = 0; c < this.base; c ++) {
        if ( (r < colors1.length) && (c < colors1[r].length) ) {
          col_row.push(colors1[r][c])
        } else {
          col_row.push(color(random(255), random(255), random(255)))
        }
      }
      colors.push(col_row)
    }

    // Create the sudoku fields: There are 9 when your base is 3.
    for (var fi = 0; fi < this.base; fi++) {
      for (var fj = 0; fj < this.base; fj++) {
        var field = new Field("square", colors[fi][fj])
        square_fields.push(field);
        for (var r = fi*this.base; r < fi*this.base+this.base; r++) {
          for (var c = fj*this.base; c < fj*this.base+this.base; c++) {
            field.addCell(this.cells[r][c])
            this.cells[r][c].addField(field)
          }
        }
      }
    }
    // create the extra NRC field
    if (nrc_trick) {
        for (let a = 0; a < (this.base-1); a++)
        {
          for (let b = 0; b < (this.base-1); b++)
          {
              var field = new Field("nrc")
              for (let fr = 0; fr < this.base; fr++)
              {
                for (let fc = 0; fc < this.base; fc++)
                {
                    let r = fr + (a*(this.base+1)+1);
                    let c = fc + (b*(this.base+1)+1);
                    
                    field[fr*this.base + fc] = this.cells[r][c];
                    this.cells[r][c].addField(field, color(180,190,180));

                }
              }
          }
        }
    }

    if (jigsaw) {
      console.log("jigsaw")
      for (let i = 0 ; i < 100; i ++) {
        let r =  Math.floor(random(0, this.depth))
        let c =  Math.floor(random(0, this.depth))
        var cell_a = this.cells[r][c];
        for (let cell_c of this.cells_all) {
          if (cell_a != cell_c) {
            if (cell_a.fields["square"] != cell_c.fields["square"]) {
              this.swapField ( cell_a, cell_c)
              if (!this.isValidField(cell_a) || !this.isValidField(cell_c) ) {
                this.swapField ( cell_a, cell_c)
              } else {
                break // swap was succes, next cell
              }
            }
          }
        }
      }



    }

  }

  // overall solver
  solve() {
    this.iteration_counter = 0
    var unfilled_cells = []
    //arrayShuffle(this.cells_all)
    for (let cell of this.cells_all){
      if (cell.value == 0) {
        unfilled_cells.push(cell)
      }
    }
    this.solve_cells(unfilled_cells, 0, 1)
    return this.iteration_counter

  }
  
  swipe() {
    this.iteration_counter = 0
    // let's check all cells if we can set them empty
    var unfilled_cells_final = []
    var swipe_cells = this.cells_all
    arrayShuffle(swipe_cells) //<-- this makes things really hard....
    for (let cell of swipe_cells){
      var unfilled_cells = []
      for (let unfilled_cell of unfilled_cells_final) {
        unfilled_cell.clear()
        unfilled_cells.push(unfilled_cell)
      }

      var cell_value_backup = cell.value
      cell.value = 0
      
      unfilled_cells.push(cell)
      unfilled_cells.sort(function(a,b) {return a.compare(b)})
      var no_sol = this.solve_cells(unfilled_cells, 0, 2)
      if (no_sol == 2) {
        cell.value = cell_value_backup
      } else {
        unfilled_cells_final.push(cell)
      }
    }

    for (let unfilled_cell of unfilled_cells_final) {
      unfilled_cell.clear()
    }

    return this.iteration_counter
  }

 
  // recursive solver
  //   returns number of solutions found
  solve_cells(unfilled_cells, no_solutions_found, no_solutions_to_find) {
    this.iteration_counter += 1

    // check if there are still empty cells, otherwise we are done.
    if (unfilled_cells.length == 0) {
      no_solutions_found ++
    } else {
      // get next cell,
      var shortest = this.depth + 1;
      var next_cell_index
      for (let unfilled_cell_index in unfilled_cells) {
        var unfilled_cell_pos_vals = unfilled_cells[unfilled_cell_index].getPossibleValues().length
        if (unfilled_cell_pos_vals < shortest ) {
          shortest = unfilled_cell_pos_vals
          next_cell_index = unfilled_cell_index
        }
      }
      var next_cell = unfilled_cells.splice(next_cell_index,1)[0]
      //var next_cell = unfilled_cells.pop()
      
      // itterate through solutions.
      var possible_values = next_cell.getPossibleValues()
      arrayShuffle(possible_values)
      for (let possible_value of possible_values) {
        next_cell.fillPossibleValue(possible_value)
        no_solutions_found = this.solve_cells(unfilled_cells, no_solutions_found, no_solutions_to_find)

        if (no_solutions_found == no_solutions_to_find) {
          break;
        }
      }
      if ( no_solutions_found < no_solutions_to_find) {
        next_cell.clear()
        unfilled_cells.push(next_cell)
      }
    }
    return no_solutions_found;
  }


  //-----------
  draw(size) {
    background(255, 255, 255);

    // first cells
    var base_w = size / this.base
    var cell_w = size / this.depth
    var f_size = cell_w/2
    textSize(f_size)
    textAlign(CENTER, CENTER);
    for (var r = 0 ; r < this.depth; r++) {
      for ( var c = 0; c < this.depth ; c++) {
        strokeWeight(0)
        fill(this.cells[r][c].color())
        rect(r*cell_w, c*cell_w, cell_w, cell_w)
        fill("black")
        var x = (r+0.5) * cell_w
        var y = (c+0.5) * cell_w
        text(this.cells[r][c].toString(), x, y )
      }
    }

    // lines afterwards
    stroke("black")
    if(!this.jigsaw) {
      for (var l = 1 ; l < this.base; l++){
        var x = base_w * l
        strokeWeight(5)
        line(0, x, size, x);
        line(x, 0, x, size);
      }
    }
    for (var l = 1 ; l < this.depth; l++){
      var x = cell_w * l
      strokeWeight(1)
      line(0, x, size, x);
      line(x, 0, x, size);
    }
  }

  setSudokuStr(sudo_str) {
    // exampl : 4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......
    // http://magictour.free.fr/top95
    for (let i = 0; i < this.cell_cnt; i++) {
      var v = sudo_str.charAt(i)
      if (v == '.') {
        this.cells_all[i].clear()
      } else {
        this.cells_all[i].fillPossibleValue(v);
      }
    }
  }

  //
  getNeighbours(cell) {
    var neighbours = [] 
    if (cell.r > 0) {
      neighbours.push(this.cells[cell.r-1][cell.c])
    }
    if (cell.r < (this.depth-1)) {
      neighbours.push(this.cells[cell.r+1][cell.c])
    }
    if (cell.c > 0) {
      neighbours.push(this.cells[cell.r][cell.c-1])
    }
    if (cell.c < (this.depth-1)) {
      neighbours.push(this.cells[cell.r][cell.c+1])
    }
    return neighbours
  }

  //
  isValidField(cell){
    var field_neighbours = new Set();
    this.addFieldNeighbours(field_neighbours, cell)
    return (field_neighbours.size == this.depth) 
  }
  addFieldNeighbours(field_neighbours, cell) {
    let neighbours = this.getNeighbours(cell)
    for (let neighbour of neighbours) {
      if ((!field_neighbours.has(neighbour)) && (neighbour.fields["square"] == cell.fields["square"])) {
        field_neighbours.add(neighbour)
        this.addFieldNeighbours(field_neighbours, neighbour)
      }
    }
  }

  //swap square field cell
  swapField(cell_a, cell_b) {
    var sq_field_a = cell_a.fields["square"]
    var sq_field_b = cell_b.fields["square"]
    cell_a.fields["square"] = sq_field_b
    cell_b.fields["square"] = sq_field_a
    sq_field_a.addCell(cell_b)
    sq_field_a.deleteCell(cell_a)
    sq_field_b.addCell(cell_a)
    sq_field_b.deleteCell(cell_b)
  }

  //-----------
  consoleLog() {
    for (var r = 0 ; r < this.depth; r++){
      let str = ""
      for ( var c = 0; c < this.depth ; c++) {
        str += this.cells[c][r] + " "
      }
      console.log(str)
    } 
  }
  //-----------
  consoleLog2() {
    let str = ""
    for (var r = 0 ; r < this.depth; r++){
      for ( var c = 0; c < this.depth ; c++) {
        str += this.cells[c][r] + ""
      }
    } 
    console.log(str)
  }

}

class Field {
  constructor(label, color) {
    this.cells = new Set();
    this.label = label
    this.color = color
  }
  addCell(cell) {
    this.cells.add(cell)
  }
  deleteCell(cell) {
    this.cells.delete(cell)
  }

}

//============================================================
class Cell {
  constructor (depth, r, c){
    this.value = 0;
    this.depth = depth;
    this.r = r;
    this.c = c;
    this.fields = {}
  }

  //-----------
  addField(field) {
    this.fields[field.label] = field
  }
  
  //-----------
  clear() {
    this.value = 0;
  }

  //-----------
  fillPossibleValue(v) {
    this.value = v;
  }

  //-----------
  getPossibleValues() 
  {
    var possible_values = []
    if (this.value == 0) {
      // init 
      let values = [this.depth+1]
      for (let i = 1; i < this.depth+1 ; i ++ ) {
        values[i] = true
      }
      // check fields
      for(let field of Object.values(this.fields)) {
        for (let cell of field.cells) {
          values[cell.value] = false;
        }
      }
      //update own data
      for (let i = 1; i < this.depth+1 ; i ++ ) {
        if (values[i]) {
          possible_values.push(i)
        }
      }

    }
    return possible_values
  }

  color() {
    var kleur = color(this.fields["square"].color)
    if ("nrc" in this.fields) {
      kleur = color("grey")
    }
    return kleur
  }

  //-----------
  toString() {
    if (this.value == 0) {
      return "."
    } else {
      return "" + this.value
    }
  }

  //compare
  compare(cell) {
    if(cell.r != this.r) {
      return cell.r - this.r
    } else {
      return cell.c - this.c
    }
  }
}

//============================================================
function arrayShuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
