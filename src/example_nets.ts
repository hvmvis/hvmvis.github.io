

const example_nets = [

  [
    "erase",
    "@main=r&(r *)~*"
  ],
  [
    "annihilate",
    "@main=r&(r *)~(* *)"
  ],
  [
    "commute",
    "@main=r&(r *)~{* *}"
  ],
  [
    "call",
    `@main=r&(r *)~@fn
    @fn={(a a) *}
    `
  ]
]

export default example_nets