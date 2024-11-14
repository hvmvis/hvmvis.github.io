const displaysvg = document.getElementById("mySvg") as HTMLDivElement



displaysvg.setAttribute("width", window.innerWidth.toString())
displaysvg.setAttribute("height", window.innerHeight.toString())

const fps = 60


class Vec2{
  x:number
  y:number
  constructor(x:number, y:number){
    this.x = x;
    this.y = y;
  }
  add(v:Vec2){return new Vec2(this.x + v.x, this.y + v.y)}
  sub(v:Vec2){return new Vec2(this.x - v.x, this.y - v.y)}
  mul(s:number){return new Vec2(this.x * s, this.y * s)}
  slen(){return this.x**2 + this.y**2}
  len(){return Math.sqrt(this.slen())}
  T(){return new Vec2(this.y, -this.x)}
  static lookat(angle:number){return new Vec2(Math.cos(angle), Math.sin(angle))}
  normalized(){return this.mul(1/this.len())}
}


let position = new Vec2(400, 200)
let planet_position = new Vec2(400,300)

let view_size = 1.

let vel = new Vec2(1, 0)

let keys_state = {
  up: false,
  down: false,
  left: false,
  right: false
}

document.addEventListener("keydown", (e) => {
  if(e.key == "ArrowUp") keys_state.up = true
  if(e.key == "ArrowDown") keys_state.down = true
  if(e.key == "ArrowLeft") keys_state.left = true
  if(e.key == "ArrowRight") keys_state.right = true
})

document.addEventListener("keyup", (e) => {
  if(e.key == "ArrowUp") keys_state.up = false
  if(e.key == "ArrowDown") keys_state.down = false
  if(e.key == "ArrowLeft") keys_state.left = false
  if(e.key == "ArrowRight") keys_state.right = false
})

let fuel = 10000

function display_rocket(){

  let rocket = document.createElementNS("http://www.w3.org/2000/svg", "circle")

  let steer = new Vec2(0, 0)
  if(keys_state.up) steer =    steer.add(new Vec2(0, -1))
  if(keys_state.down) steer =  steer.add(new Vec2(0, 1))
  if(keys_state.left) steer =  steer.add(new Vec2(-1, 0))
  if(keys_state.right) steer = steer.add(new Vec2(1, 0))
  if (steer.len() > 0 && fuel > 0){
    steer = steer.normalized().mul(0.1 /fps)
    fuel -= 1
    vel = vel.add(steer)
  }
  // if (fuel <= 0){
    // alert("You are out of fuel")
  // }

  const fueltext = document.createElementNS("http://www.w3.org/2000/svg", "text")
  fueltext.setAttribute("x", "10")
  fueltext.setAttribute("y", "100")
  fueltext.setAttribute("fill", "white")
  fueltext.innerHTML = "Fuel: " + fuel.toString()
  displaysvg.appendChild(fueltext)


  position = position.add(vel)

  const distance = position.sub(planet_position).len()

  view_size = Math.max(.1,distance/200)
  if (distance < 20){
    alert("You crashed")
  }
  const gravity = position.sub(planet_position).normalized().mul(1/distance**2).mul(10000/fps)

  vel = vel.sub(gravity)

  rocket.setAttribute("cx", ((position.x-planet_position.x)/view_size +planet_position.x).toString())
  rocket.setAttribute("cy", ((position.y-planet_position.y)/view_size +planet_position.y).toString())

  rocket.setAttribute("r", (10/view_size).toString())
  rocket.setAttribute("fill", "red")

  displaysvg.appendChild(rocket)
  const displaypos = new Vec2((position.x-planet_position.x)/view_size +planet_position.x, (position.y-planet_position.y)/view_size +planet_position.y)
  const displayx = document.createElementNS("http://www.w3.org/2000/svg", "path")
  displayx.setAttribute("d", `M ${displaypos.x} ${displaypos.y} L ${displaypos.add(vel.mul(10)).x} ${displaypos.add(vel.mul(10)).y}`)

  displayx.setAttribute("stroke", "white")
  displaysvg.appendChild(displayx)



}

function display_planet(){
  
    let planet = document.createElementNS("http://www.w3.org/2000/svg", "circle")
  
    planet.setAttribute("cx", planet_position.x.toString())
    planet.setAttribute("cy", planet_position.y.toString())
  
    planet.setAttribute("r", (10/view_size).toString())
    planet.setAttribute("fill", "blue")


    const planetx = document.createElementNS("http://www.w3.org/2000/svg", "path")
    planetx.setAttribute("d", `M ${planet_position.x} ${planet_position.y} L ${planet_position.add(position.sub(planet_position).normalized().mul(10)).x} ${planet_position.add(position.sub(planet_position).normalized().mul(10)).y}`)
    planetx.setAttribute("stroke", "white")
    displaysvg.appendChild(planetx)
  
    displaysvg.appendChild(planet)

}


setInterval(() => {

  displaysvg.innerHTML = ""

  display_rocket()
  display_planet()
  
}, 1000/fps);
