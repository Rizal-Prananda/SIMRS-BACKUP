<?php

namespace App\Services;

class WebUserPasswordVerifier
{
    public function verify(string $plainPassword, string $storedPassword): bool
    {
        if ($plainPassword === '' || $storedPassword === '') {
            return false;
        }

        if (password_get_info($storedPassword)['algoName'] !== 'unknown') {
            return password_verify($plainPassword, $storedPassword);
        }

        if (preg_match('/^[a-f0-9]{32}$/i', $storedPassword) === 1) {
            return hash_equals(strtolower($storedPassword), md5($plainPassword));
        }

        if (preg_match('/^[a-f0-9]{40}$/i', $storedPassword) === 1) {
            return hash_equals(strtolower($storedPassword), sha1($plainPassword));
        }

        return hash_equals($storedPassword, $plainPassword);
    }
}
