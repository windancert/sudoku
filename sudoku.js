let my_sudoku;

let settings = {}
settings.base = 2
settings.nrc = false
settings.jigsaw = false; 

settings.show_possiblilites = true

//============================================================
function setup() {

  createCanvas(windowHeight, windowHeight);
  
  frameRate(1);


  my_sudoku = new sudoku(settings.base, settings.nrc )
  

  this.gui = new dat.GUI();
  this.gui.add(settings, "base", [2, 3, 4])
  this.gui.add(settings, "nrc")
  this.gui.add(settings, "jigsaw")
  this.gui.add(this, "create")
  this.gui.add(this, "solve")
  let gui_inp = this.gui.addFolder('special')
  this.sudoku_str = "4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......"
  gui_inp.add(this, "set_input_sudoku")
  gui_inp.add(this, "sudoku_str")
  gui_inp.add(settings, "show_possiblilites")
  

}

function create() {
  let iterations
  let start = Date.now()
  my_sudoku = new sudoku(parseInt(settings.base), settings.nrc, settings.jigsaw )
  iterations = my_sudoku.solve();
  console.log ( " creation " + iterations)
  my_sudoku.consoleLog()
  iterations = my_sudoku.swipe();
  let end = Date.now()
  console.log( " swiped " + iterations + " d_time " + (end - start)/1000 + " it_time: " + iterations/(end - start))
  my_sudoku.consoleLog()
  my_sudoku.consoleLog2()


}

function set_input_sudoku() {
  console.log("set input sudoku")
  my_sudoku = new sudoku(3, false)
  my_sudoku.setSudokuStr(this.sudoku_str)
  // my_sudoku.solve();
}

function solve(){
  console.log("solving")
  my_sudoku.solve();
}

//============================================================
function draw() {
  let canv_size ;
  if (windowWidth < windowHeight) {
    canv_size = windowWidth
  } else{
    canv_size = windowHeight 
  }
  my_sudoku.draw(canv_size-20)

}

function mousePressed() {
  my_sudoku.click(mouseX, mouseY)
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
    for (let r = 0; r < this.depth; r++) {
      this.cells[r] = new Array(this.depth)
      for ( let c = 0; c < this.depth ; c++) {
        this.cells[r][c] = new Cell(this.depth, r,c);
        this.cells_all[r*this.depth + c] = this.cells[r][c]
      }
    }

    //create line fields (arrays of cells)
    for (let r = 0 ; r < this.depth; r++){
      let field = new Field("column")
      for ( let c = 0; c < this.depth ; c++) {
        field.addCell(this.cells[r][c])
        this.cells[r][c].addField(field)
      }
    }
    for (let c = 0 ; c < this.depth; c++){
      let field = new Field("row")
      for ( let r = 0; r < this.depth ; r++) {
        field.addCell(this.cells[r][c])
        this.cells[r][c].addField(field)
      }
    }
    let square_fields = []
    let colors1 = [[color("red"), color("blue"), color("green")],
                  [color("yellow"), color("magenta"), color("cyan")],
                  [color("white"), color("purple"), color("orange")]];
    let colors = []
    for ( let r = 0; r < this.base; r ++) {
      let col_row = [] 
      for ( let c = 0; c < this.base; c ++) {
        if ( (r < colors1.length) && (c < colors1[r].length) ) {
          col_row.push(colors1[r][c])
        } else {
          col_row.push(color(random(255), random(255), random(255)))
        }
      }
      colors.push(col_row)
    }

    // Create the sudoku fields: There are 9 when your base is 3.
    for (let fi = 0; fi < this.base; fi++) {
      for (let fj = 0; fj < this.base; fj++) {
        let field = new Field("square", colors[fi][fj])
        square_fields.push(field);
        for (let r = fi*this.base; r < fi*this.base+this.base; r++) {
          for (let c = fj*this.base; c < fj*this.base+this.base; c++) {
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
              let field = new Field("nrc")
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
        let cell_a = this.cells[r][c];
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
    let unfilled_cells = []
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
    let unfilled_cells_final = []
    let swipe_cells = this.cells_all
    arrayShuffle(swipe_cells) //<-- this makes things really hard....
    for (let cell of swipe_cells){
      let unfilled_cells = []
      for (let unfilled_cell of unfilled_cells_final) {
        unfilled_cell.clear()
        unfilled_cells.push(unfilled_cell)
      }

      let cell_value_backup = cell.value
      cell.value = 0
      
      unfilled_cells.push(cell)
      unfilled_cells.sort(function(a,b) {return a.compare(b)})
      let no_sol = this.solve_cells(unfilled_cells, 0, 2)
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
      let shortest = this.depth + 1;
      let next_cell_index
      for (let unfilled_cell_index in unfilled_cells) {
        let unfilled_cell_pos_vals = unfilled_cells[unfilled_cell_index].getPossibleValues().length
        if (unfilled_cell_pos_vals < shortest ) {
          shortest = unfilled_cell_pos_vals
          next_cell_index = unfilled_cell_index
        }
      }
      let next_cell = unfilled_cells.splice(next_cell_index,1)[0]
      //let next_cell = unfilled_cells.pop()
      
      // itterate through solutions.
      let possible_values = next_cell.getPossibleValues()
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

  click(x,y) {
    if ((x < this.size) && (y < this.size)) {
      let fr = Math.floor(y / this.base_w) % this.depth
      let fc = Math.floor(x / this.base_w) % this.depth
      let cr = Math.floor(y / this.cell_w) % this.depth
      let cc = Math.floor(x / this.cell_w) % this.depth
      console.log("f r c  " + String(fr) + " " + String(fc))
      console.log("c r c  " + String(cr) + " " + String(cc))
  
     
    }
  }

  //-----------
  draw(size) {
    background(255, 255, 255);
    this.size = size

    // first cells
    this.base_w = size / this.base
    this.cell_w = size / this.depth
    let f_size = this.cell_w/2
    textSize(f_size)
    textAlign(CENTER, CENTER);
    for (let r = 0 ; r < this.depth; r++) {
      for ( let c = 0; c < this.depth ; c++) {
        strokeWeight(0)
        fill(this.cells[r][c].color())
        rect(r*this.cell_w, c*this.cell_w, this.cell_w, this.cell_w)
        let x = (r+0.5) * this.cell_w
        let y = (c+0.5) * this.cell_w
        if (settings.show_possiblilites) {
          if (this.cells[r][c].value != 0) {
            fill("black")
            textSize(f_size)
            text(this.cells[r][c].toString(), x, y )
          } else {
            fill(200)
            let cd_w = this.cell_w / this.base
            let cd_h = this.cell_w / this.base
            let pvs = this.cells[r][c].getPossibleValues()
            textSize(f_size/this.base)
            for (let pv of pvs) {
              let cd_x = r*this.cell_w + ((pv-1)%this.base + 0.5)*cd_h
              let cd_y = c*this.cell_w + (Math.floor((pv-1)/this.base) + 0.5)*cd_w
              text(String(pv), cd_x, cd_y )
            } 
          }
        } else {
          fill("black")
          text(this.cells[r][c].toString(), x, y )
        }
      }
    }

    // lines afterwards
    stroke("black")
    if(!this.jigsaw) {
      for (let l = 1 ; l < this.base; l++){
        let x = this.base_w * l
        strokeWeight(5)
        line(0, x, size, x);
        line(x, 0, x, size);
      }
    }
    for (let l = 1 ; l < this.depth; l++){
      let x = this.cell_w * l
      strokeWeight(1)
      line(0, x, size, x);
      line(x, 0, x, size);
    }
  }

  setSudokuStr(sudo_str) {
    // exampl : 4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......
    // http://magictour.free.fr/top95
    for (let i = 0; i < this.cell_cnt; i++) {
      let v = sudo_str.charAt(i)
      if (v == '.') {
        this.cells_all[i].clear()
      } else {
        this.cells_all[i].fillPossibleValue(v);
      }
    }
  }

  //
  getNeighbours(cell) {
    let neighbours = [] 
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
    let field_neighbours = new Set();
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
    let sq_field_a = cell_a.fields["square"]
    let sq_field_b = cell_b.fields["square"]
    cell_a.fields["square"] = sq_field_b
    cell_b.fields["square"] = sq_field_a
    sq_field_a.addCell(cell_b)
    sq_field_a.deleteCell(cell_a)
    sq_field_b.addCell(cell_a)
    sq_field_b.deleteCell(cell_b)
  }

  //-----------
  consoleLog() {
    for (let r = 0 ; r < this.depth; r++){
      let str = ""
      for ( let c = 0; c < this.depth ; c++) {
        str += this.cells[c][r] + " "
      }
      console.log(str)
    } 
  }
  //-----------
  consoleLog2() {
    let str = ""
    for (let r = 0 ; r < this.depth; r++){
      for ( let c = 0; c < this.depth ; c++) {
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
    let possible_values = []
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
    let kleur = color(this.fields["square"].color)
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
