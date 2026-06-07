# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{pkgs}: {
  channel = "stable-24.11";
  packages = [
    pkgs.nodejs_20
    pkgs.zulu
  ];
  env = {};
  idx = {
    extensions = [
      "bradlc.vscode-tailwindcss"
      "dsznajder.es7-react-js-snippets"
      "esbenp.prettier-vscode"
      "dbaeumer.vscode-eslint"
    ];
    workspace = {
      onCreate = {
        install = "npm install"; # تثبيت الاعتمادات تلقائياً
        default.openFiles = [ "src/app/page.tsx" ];
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}

