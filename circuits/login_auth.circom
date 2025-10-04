pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template LoginAuth() {
    signal input password;
    signal input storedHash;
    signal output storedHashOut;

    // Use Poseidon hash for secure password verification
    component poseidon = Poseidon(1);
    poseidon.inputs[0] <== password;
    
    // Compare the hashed password with the stored hash
    component eq = IsEqual();
    eq.in[0] <== poseidon.out;
    eq.in[1] <== storedHash;
    
    // The circuit will only generate a valid proof if the password matches
    // The constraint ensures that eq.out must be 1 for a valid proof
    // This means only valid passwords can generate proofs
    eq.out === 1;
    
    // Output only the stored hash as a public signal for contract verification
    storedHashOut <== storedHash;
}

template IsEqual() {
    signal input in[2];
    signal output out;
    
    component isz = IsZero();
    isz.in <== in[1] - in[0];
    out <== isz.out;
}

template IsZero() {
    signal input in;
    signal output out;
    
    signal inv;
    inv <-- in != 0 ? 1/in : 0;
    out <== -in*inv + 1;
    in*out === 0;
}

component main = LoginAuth();
