

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
    @fn={(a a) *}`
  ],
  [
    "index0",
    `@main=r&?((4 5) r)~0`
  ],
  [
    'index2',
    `@main=r
    & array ~ (1 (2 (3 (4 *))))
    & 2 ~ ?(array r)`
  ],
  [
    'operate',
    `@main=r
    & 22 ~ $([+ 33] r)`
  ],
  [
    "operate2",
    `@main=r
     & [+ 22] ~ $(33 $([+ 44] r))`
  ]
]

export default example_nets