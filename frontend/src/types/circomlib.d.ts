declare module 'circomlib' {
  export function poseidon(inputs: bigint[]): bigint;
  export function poseidonHash(inputs: bigint[]): bigint;
  export function poseidonHash2(inputs: [bigint, bigint]): bigint;
  export function poseidonHash3(inputs: [bigint, bigint, bigint]): bigint;
  export function poseidonHash4(inputs: [bigint, bigint, bigint, bigint]): bigint;
  export function poseidonHash5(inputs: [bigint, bigint, bigint, bigint, bigint]): bigint;
  export function poseidonHash6(inputs: [bigint, bigint, bigint, bigint, bigint, bigint]): bigint;
}
