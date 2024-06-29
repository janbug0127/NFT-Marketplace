import { useState, useEffect } from 'react'
import { ethers } from "ethers"
import { Row, Col, Card } from 'react-bootstrap'

const fetchMetaData = (ipfsHash) => {
  const metaDataJson = localStorage.getItem(`metadata_${ipfsHash}`);

  if(!metaDataJson){
    console.log(`no metadata found for NFT ${ipfsHash}`);
    return null;
  }
  try{
    const metaData = JSON.parse(metaDataJson);
    console.log(`metadata for nft ${ipfsHash} fetched successfully`);
    return metaData;
  }catch(err){
    console.error('error parsing metadata from localstorage: ', err);
    return null;
  }
};

function renderSoldItems(items) {
  return (
    <>
      <h2>Sold</h2>
      <Row xs={1} md={2} lg={4} className="g-4 py-3">
        {items.map((item, idx) => (
          <Col key={idx} className="overflow-hidden">
            <Card>
              <Card.Img variant="top" src={item.image} />
              <Card.Footer>
                For {ethers.utils.formatEther(item.totalPrice)} ETH - Recieved {ethers.utils.formatEther(item.price)} ETH
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}

export default function MyListedItems({ marketplace, nft, account }) {
  const [loading, setLoading] = useState(true)
  const [listedItems, setListedItems] = useState([])
  const [soldItems, setSoldItems] = useState([])
  const loadListedItems = async () => {
    // Load all sold items that the user listed
    const itemCount = await marketplace.itemCount()
    let listedItems = []
    let soldItems = []
    for (let indx = 1; indx <= itemCount; indx++) {
      const i = await marketplace.items(indx)
      if (i.seller.toLowerCase() === account) {
        // get uri url from nft contract
        const uri = await nft.tokenURI(i.tokenId)
        console.log("list ki uri: ", uri);
        const parts = uri.split("/");
        const ipfsHash = parts[parts.length - 1];
        const metaData = fetchMetaData(ipfsHash);
        console.log("metadata: ",metaData);
        // use uri to fetch the nft metadata stored on ipfs 
        // const response = await fetch(uri)
        // const metadata = await response.json()
        // get total price of item (item price + fee)
        const totalPrice = await marketplace.getTotalPrice(i.itemId)
        // define listed item object
        let name = "name";
        let desc = "desc";
        let image = "https://violet-key-lamprey-665.mypinata.cloud/ipfs/QmZ7T82k9pDCDMMXpaxk5JnaBZMRdRmhsGDqjrAuKXS9st";
        if(metaData!=null){
          name = metaData.name;
          desc = metaData.description;
          image = metaData.image;
        }
        let item = {
          totalPrice,
          price: i.price,
          itemId: i.itemId,
          name: name,
          description: desc,
          image: image
        }
        listedItems.push(item)
        // Add listed item to sold items array if sold
        if (i.sold) soldItems.push(item)
      }
    }
    setLoading(false)
    setListedItems(listedItems)
    setSoldItems(soldItems)
  }
  useEffect(() => {
    loadListedItems()
  }, [])
  if (loading) return (
    <main style={{ padding: "1rem 0" }}>
      <h2>Loading...</h2>
    </main>
  )
  return (
    <div className="flex justify-center">
      {listedItems.length > 0 ?
        <div className="px-5 py-3 container">
            <h2>Listed</h2>
          <Row xs={1} md={2} lg={4} className="g-4 py-3">
            {listedItems.map((item, idx) => (
              <Col key={idx} className="overflow-hidden">
                <Card>
                  <Card.Img variant="top" src={item.image} />
                  <Card.Footer>{ethers.utils.formatEther(item.totalPrice)} ETH</Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
            {soldItems.length > 0 && renderSoldItems(soldItems)}
        </div>
        : (
          <main style={{ padding: "1rem 0" }}>
            <h2>No listed assets</h2>
          </main>
        )}
    </div>
  );
}