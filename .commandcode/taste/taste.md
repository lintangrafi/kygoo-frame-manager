# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# git
- Commit and push from within the kygoo-frame-studio subdirectory, not the parent D:\Project folder. Remote: https://github.com/lintangrafi/kygoo-frame-manager.git. Confidence: 0.65

# workflow
- After design critique: apply the identified fixes autonomously — fix according to design judgment rather than waiting for explicit instructions on each issue. Confidence: 0.65
- Before claiming completion: run the full verification command (tests/build/lint), read the output, and only claim success with fresh evidence. No "should work" claims without running verification. Confidence: 0.70
- When edit_file fails (e.g., CRLF/LF mismatch, exact text not found), fall back to write_file with the entire file content instead of retrying edit_file. Confidence: 0.65

