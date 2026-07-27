# Obsidian Random Topic for Daily Notes

ノート作成時に、設定で登録したトピック候補の中からランダムに選んでテンプレート内の `{{topic}}` を置換する。

## Install

Run [install.ps1](install.ps1) with vault folder path as an argument.

管理対象のフォルダパスを引数にして [install.ps1](install.ps1) を実行する。

```
# Example
.\install.ps1 C:\Users\awtnb\Obsidian\Diary
```

### Manual install

Copy over `main.js`, `styles.css`, `manifest.json` to `(VaultFolder)/.obsidian/plugins/obsidian-random-topic/` .

`main.js` ・ `styles.css` ・ `manifest.json` をそれぞれ `（管理対象のフォルダ）/.obsidian/plugins/obsidian-random-topic/` にコピーしてもインストール可能。

## Develop / Debug

Run below command in Vault root directory.

```PowerShell
$n="obsidian-random-topic";$repo="https://github.com/AWtnb/$n.git";$p=".obsidian"|Join-Path -ChildPath "plugins";if (-not(Test-Path $p -PathType Container)){New-Item -Path $p -ItemType Directory}Push-Location $p;git clone $repo; cd $n;if (Get-Command code -ErrorAction SilentlyContinue){code .};Pop-Location
```

With [ghq](https://github.com/x-motemen/ghq):

```PowerShell
ghq get "https://github.com/AWtnb/obsidian-random-topic" --silent|sv src;$p=".obsidian"|Join-Path -ChildPath "plugins";if (-not(Test-Path $p -PathType Container)){New-Item -Path $p -ItemType Directory};Push-Location $p;New-Item -Name (gi $src).Name -Value $src -ItemType Junction -Confirm -Force; Pop-Location; code $src
```

Afterwords, run `npm i` and `npm run dev`.

Then on Obsidian, run `Reload app without saving` command. `Random-Topic` should appear in `Community plugins` setting.


---

- Generated from [obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
- [API Documentation](https://github.com/obsidianmd/obsidian-api)
- [Mobile development](https://docs.obsidian.md/Plugins/Getting+started/Mobile+development)

    ```JavaScript
    this.app.emulateMobile(!this.app.isMobile);
    ```
