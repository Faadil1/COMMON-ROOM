import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {CommonRoomFilm} from './film.jsx';

const Root=()=> <Composition id="CommonRoomFilmV3" component={CommonRoomFilm} durationInFrames={1680} fps={30} width={1920} height={1080}/>;
registerRoot(Root);
