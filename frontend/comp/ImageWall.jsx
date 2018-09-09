import React from 'react';


class OneImage extends React.Component {
    
    render() {
        return (
        <div className="card">
            <div className="card-image">
              <figure className="image">
                <img src={this.props.img} alt="" ref={(img) => { this.foo = img; }}/>
              </figure>
            </div>
          

        </div>
        );
        
    }

    componentDidMount() {
        this.foo.onload = () => {   
            console.log( this.foo.width + ", " + this.foo.height );
        };
    }
}

export class ImageWall extends React.Component {

    render() {
        return (<div className="imagewall">
            { this.props.images.map((image, index) => {
                return (<OneImage  key={index} img={image} />);
            })} 
        </div>)
    }
}