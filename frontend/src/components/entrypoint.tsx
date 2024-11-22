import { LuUpload } from 'react-icons/lu';
import { useState, useCallback, useEffect } from 'preact/hooks';
import { ChangeEvent } from 'preact/compat';
import './entrypoint.css';

interface EntrypointProps {
  onStartEmulating: () => void;
  onOpenSettings: () => void;
}

export default function Entrypoint({ onStartEmulating, onOpenSettings }: EntrypointProps) {
  const [romFileName, setRomFileName] = useState<string|null>(null);
  const [romFile, setRomFile] = useState<File|null>(null);
  const [loading, setLoading] = useState(false);
  const [isFirmwareBooting, setFirmwareBooting] = useState(false);
  const [firmwareBootEnabled, setFirmwareBootEnabled] = useState(false);

  const fileSelectHandler = (event: ChangeEvent<HTMLInputElement>) => {
    let input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    setRomFile(input.files[0]);
    setRomFileName(input.files[0].name);
  };

  const fileDropHandler = (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer?.files.length) {
      setRomFile(event.dataTransfer.files[0]);
      setRomFileName(event.dataTransfer.files[0].name);
    }
  };

  const prepareHandler = useCallback(async () => {
    console.log('starting prepare handler');
    if (isFirmwareBooting) {
      window.WebMelon.emulator.loadUserBIOS();
    } else {
      let gameCode = window.WebMelon.cart.getUnloadedCartCode();
      console.log(gameCode);
      window.WebMelon.emulator.setSavePath('/savefiles/' + gameCode + '.sav');
      window.WebMelon.emulator.loadFreeBIOS();
      window.WebMelon.emulator.loadCart();
    }
    setLoading(false);
    onStartEmulating();
  }, [isFirmwareBooting]);
  
  const playHandler = useCallback(async () => {
    if (!window.WebMelon || !romFile || loading) {
      return;
    }

    setLoading(true);

    const romData = new Uint8Array(await romFile.arrayBuffer());

    window.WebMelon.cart.createCart();
    window.WebMelon.storage.createDirectory('/roms');
    window.WebMelon.storage.write('/roms/game.nds', romData);
    window.WebMelon.emulator.createEmulator();
    if (!window.WebMelon.cart.loadFileIntoCart('/roms/game.nds')) {
      setLoading(false);
      return;
    }
    window.WebMelon.storage.onPrepare(prepareHandler);
    window.WebMelon.storage.prepareVirtualFilesystem();
  }, [romFile, loading]);

  const firmwareBootHandler = useCallback(async () => {
    if (!window.WebMelon || loading) {
      return;
    }

    setLoading(true);
    window.WebMelon.emulator.createEmulator();

    setFirmwareBooting(true);
  }, [loading, firmwareBootEnabled, isFirmwareBooting]);

  useEffect(() => {
    if (isFirmwareBooting) {
      window.WebMelon.storage.onPrepare(prepareHandler);
      window.WebMelon.storage.prepareVirtualFilesystem();
    }
  }, [isFirmwareBooting]);

  useEffect(() => {
    window.WebMelon.firmware.canFirmwareBoot();
    setTimeout(() => {
      setFirmwareBootEnabled(window.WebMelon.firmware.canFirmwareBoot());
    }, 500);
  }, []);

  return (
    <>
      <h1>{'🎮 DS Anywhere'}</h1>
      <p>
        Emulate a Nintendo DS entirely inside of your browser! To get started, add the .nds ROM file you would like
        to run below! Your files stay locally on your computer and are not uploaded anywhere. You may also add your
        own BIOS files in Settings to perform a Firmware Boot, which will allow you to boot into the Main Menu if
        you desire.
      </p>
      <p>
        You may also configure certain parts of the emulator (such as keybinds, user information, and firmware files)
        in <a class="link link-primary" onClick={onOpenSettings}>Settings...</a>
      </p>
      <p>
        <b>Note:</b> This software is still in development, and you may encounter unintended behavior or lose saved
        data at anytime.
      </p>
      <label for="rom-file-input" onDrop={fileDropHandler} onDragOver={(e)=>e.preventDefault()}>
        <div className="rom-input-container" >
          <LuUpload size={30}/>
          <p><b>Insert ROM file</b></p>
          <p>
            Drag and drop, supports .nds files
          </p>
          {romFileName ? (
            <p>
              Selected: {romFileName}
            </p>
          ) : ''}
        </div>
      </label>
      <input type="file" id="rom-file-input" onChange={fileSelectHandler} />
      <button class="btn btn-primary play-button" disabled={romFile === null || loading} onClick={playHandler}>
        {loading ? (<span className="loading loading-spinner loading-xs"></span>) : ''} Play
      </button>
      {firmwareBootEnabled ? (
        <button class="btn btn-secondary play-button" disabled={loading} onClick={firmwareBootHandler}>
          {loading ? (<span className="loading loading-spinner loading-xs"></span>) : ''} Firmware Boot
        </button>
      ) : null}
      <div class="footer-disclaimer">
        <span class="disclaimer-text">
          <a class="link link-primary" onClick={onOpenSettings}>Settings</a> • <a href="https://github.com/brxxn/ds-anywhere" class="link link-primary">GitHub</a>
        </span>
        <br />
        <span class="disclaimer-text">
          This emulator should <i>only</i> be used to emulate legally acquired ROM and BIOS files. This emulator
          is not affiliated with or endorsed by Nintendo. The Nintendo DS is a trademark of Nintendo Corporation,
          Limited.
        </span>
      </div>
    </>
  );
}