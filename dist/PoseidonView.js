'use strict';

function _interopDefault(ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var PropTypes = _interopDefault(require('prop-types'));

const options = {
  hosts: {
    domain: 'meet.jit.si',
    muc: 'conference.meet.jit.si' // FIXME: use XEP-0030
  },
  bosh: '//meet.jit.si/http-bind', // FIXME: use xep-0156 for that

  // The name of client node advertised in XEP-0115 'c' stanza
  clientNode: 'http://jitsi.org/jitsimeet'
};

let connection = null;

let room = null;

const confOptions = {
  openBridgeChannel: true
};

let localTracks = [];
const remoteTracks = {};

let isJoined = false;

function styleInject(css, ref) {
  if (ref === void 0) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css = "/* add css styles here (optional) */\n\n.styles_test__32Qsm {\n  display: inline-block;\n  margin: 2em auto;\n  border: 2px solid #000;\n  font-size: 2em;\n}\n";
var styles = { "test": "styles_test__32Qsm" };
styleInject(css);

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var PoseidonView = function (_Component) {
  inherits(PoseidonView, _Component);

  function PoseidonView() {
    classCallCheck(this, PoseidonView);

    return possibleConstructorReturn(this, (PoseidonView.__proto__ || Object.getPrototypeOf(PoseidonView)).apply(this, arguments));
  }

  createClass(PoseidonView, [{
    key: 'render',
    value: function render() {
      var _this6 = this;

      return React__default.createElement('div', {
        ref: function ref(node) {
          _this6.node = node;
        }
      });
    }
  },
  {
    key: 'componentDidMount',
    value: function componentDidMount() {
      console.log('componentDidMount');

      JitsiMeetJS.init();
      connection = new JitsiMeetJS.JitsiConnection(null, null, options);

      connection.addEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        () => this.onConnectionSuccess());
      connection.addEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        () => this.onConnectionFailed());
      connection.addEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        () => this.disconnect);

      JitsiMeetJS.mediaDevices.addEventListener(
        JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
        () => this.onDeviceListChanged());

      connection.connect();

      JitsiMeetJS.createLocalTracks({ devices: ['audio', 'video'] })
        .then((tracks) => this.onLocalTracks(tracks))
        .catch(error => {
          throw error;
        });

      if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable('output')) {
        JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
          const audioOutputDevices
            = devices.filter(d => d.kind === 'audiooutput');

          if (audioOutputDevices.length > 1) {
            console.log('audioOutputDevices');
            // $('#audioOutputSelect').html(
            //   audioOutputDevices
            //     .map(
            //       d =>
            //         `<option value="${d.deviceId}">${d.label}</option>`)
            //     .join('\n'));

            // $('#audioOutputSelectWrapper').show();
          }
        });
      }
    }
  },
  {
    key: 'onLocalTracks',
    value: function onLocalTracks(tracks) {
      console.log('local ');
      localTracks = tracks;
      for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].addEventListener(
          JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
          audioLevel => { });
        localTracks[i].addEventListener(
          JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
          () => console.log('local track muted'));
        localTracks[i].addEventListener(
          JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
          () => console.log('local track stoped'));
        localTracks[i].addEventListener(
          JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
          deviceId =>
            console.log(
              `track audio output device was changed to ${deviceId}`));
        if (localTracks[i].getType() === 'video') {
          let video = document.createElement("video");
          video.autoplay = true;
          video.id = 'localVideo' + i;
          video.width = 250;
          video.height = 250;

          // document.body.appendChild(video);
          this.node.appendChild(video);
          localTracks[i].attach(video);
        } else {
          let audio = document.createElement("audio");
          audio.autoplay = true;
          audio.id = 'localAudio' + i;
          audio.muted = true;

          // document.body.appendChild(audio);
          this.node.appendChild(audio);
          localTracks[i].attach(audio);
        }
        if (isJoined) {
          room.addTrack(localTracks[i]);
        }
      }

    }
  },
  {
    key: 'onConnectionSuccess',
    value: function onConnectionSuccess() {
      console.error('onConnectionSuccess');
      var roomName = this.props.roomName;
      room = connection.initJitsiConference(roomName, confOptions);
      room.on(JitsiMeetJS.events.conference.TRACK_ADDED, (track) => this.onRemoteTrack(track));
      room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, track => {
        console.log(`track removed!!!${track}`);
      });
      room.on(
        JitsiMeetJS.events.conference.CONFERENCE_JOINED,
        () => this.onConferenceJoined());
      room.on(JitsiMeetJS.events.conference.USER_JOINED, id => {
        console.log('user join');
        remoteTracks[id] = [];
      });
      room.on(JitsiMeetJS.events.conference.USER_LEFT, () => this.onUserLeft());
      room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => {
        console.log(`${track.getType()} - ${track.isMuted()}`);
      });
      room.on(
        JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED,
        (userID, displayName) => console.log(`${userID} - ${displayName}`));
      room.on(
        JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
        (userID, audioLevel) => { });
      room.on(
        JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED,
        () => console.log(`${room.getPhoneNumber()} - ${room.getPhonePin()}`));

      console.error('room join');
      room.join();
    }
  },
  {
    key: 'onConnectionFailed',
    value: function onConnectionFailed() {
      console.error('Connection Failed!');
    }
  },
  {
    key: 'onDeviceListChanged',
    value: function onDeviceListChanged() {
      console.info('current devices', devices);
    }
  },
  {
    key: 'disconnect',
    value: function disconnect() {
      console.log('disconnect!');
      connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
        () => this.onConnectionSuccess());
      connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_FAILED,
        () => this.onConnectionFailed());
      connection.removeEventListener(
        JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
        () => this.disconnect());
    }
  },
  {
    key: 'onConferenceJoined',
    value: function onConferenceJoined() {
      console.error('conference joined! ' + localTracks.length);
      isJoined = true;
      for (let i = 0; i < localTracks.length; i++) {
        room.addTrack(localTracks[i]);
      }
    }
  },
  {
    key: 'onUserLeft',
    value: function onUserLeft() {
      console.log('user left');
      if (!remoteTracks[id]) {
        return;
      }
      const tracks = remoteTracks[id];

      for (let i = 0; i < tracks.length; i++) {
        let att = document.getElementById(id + tracks[i].getType());
        tracks[i].detach(att);

        this.node.removeChild(att);
      }
    }
  },
  {
    key: 'onRemoteTrack',
    value: function onRemoteTrack(track) {
      if (track.isLocal()) {
        return;
      }
      const participant = track.getParticipantId();

      let _parti = room.getParticipantById(participant);
      let _partiName = _parti.getDisplayName();

      if (!_partiName.includes('TEACHER')) {
        return;
      }

      if (!remoteTracks[participant]) {
        remoteTracks[participant] = [];
      }
      const idx = remoteTracks[participant].push(track);

      track.addEventListener(
        JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
        audioLevel => { });
      track.addEventListener(
        JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
        () => console.log('remote track muted'));
      track.addEventListener(
        JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
        () => console.log('remote track stoped'));
      track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
        deviceId =>
          console.log(
            `track audio output device was changed to ${deviceId}`));
      const id = participant + track.getType() + idx;
      console.error('id = ' + id);

      if (track.getType() === 'video') {
        let video = document.createElement("video");
        video.autoplay = true;
        video.id = participant + 'video' + idx;
        video.width = 250;
        video.height = 250;

        // document.body.appendChild(video);
        this.node.appendChild(video);
      } else {
        let audio = document.createElement("audio");
        audio.autoplay = true;
        audio.id = participant + 'audio' + idx;

        // document.body.appendChild(audio);
        this.node.appendChild(audio);
      }
      let att = document.getElementById(id);
      track.attach(att);
    }
  }
  ]);
  return PoseidonView;
}(React.Component);

PoseidonView.propTypes = {
  roomName: PropTypes.string
};

module.exports = PoseidonView;
//# sourceMappingURL=index.js.map
